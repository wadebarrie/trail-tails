import { listCustomerContacts } from "@/lib/customer-contacts";
import { formatTime } from "@/lib/dates";
import { createServiceClient } from "@/lib/supabase/service";
import { logError, logErrorFromException, logWarn } from "@/lib/logger";
import { perfAsync } from "@/lib/perf";
import { findRecentOutboundSms, getSmsRedirectTo, getTwilioConfig, sendSms } from "@/lib/twilio";
import { SMS_LOOKUP_MAX_MS, resolveSmsDelivery, smsAbortTimeoutMs } from "@/lib/twilio/outcome";
import { runWithSmsBudget, smsBudgetActive, takeSmsSlice } from "@/lib/sms-budget";
import type { NotificationType } from "@/types";

type NotificationBody = string | ((ownerName: string) => string);

type LogNotificationInput = {
  companyId: string;
  customerId?: string;
  dogId?: string;
  dogName?: string;
  stopId?: string;
  notificationType: NotificationType;
  body: NotificationBody;
  /** When set, only these contact phones are texted. */
  onlyPhones?: string[];
};

async function resolveCustomerContacts(customerId: string | undefined) {
  if (!customerId) return [];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("customers")
    .select("owner_name, phone, secondary_owner_name, secondary_phone")
    .eq("id", customerId)
    .maybeSingle();

  if (!data) return [];
  return listCustomerContacts(data);
}

async function resolveDogName(dogId: string | undefined): Promise<string | null> {
  if (!dogId) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dogs")
    .select("name")
    .eq("id", dogId)
    .maybeSingle();

  return data?.name ?? null;
}

function smsDeliveryForContact(
  customerPhone: string,
  ownerName: string,
  dogName: string | null
): { to: string; body: string; redirected: boolean } {
  const delivery = resolveSmsDelivery(
    customerPhone,
    ownerName,
    dogName,
    getSmsRedirectTo()
  );
  return {
    to: delivery.to,
    body: delivery.bodyPrefix,
    redirected: delivery.redirected,
  };
}

function smsContext(input: LogNotificationInput, extra?: Record<string, unknown>) {
  return {
    companyId: input.companyId,
    context: {
      notificationType: input.notificationType,
      customerId: input.customerId ?? null,
      dogId: input.dogId ?? null,
      stopId: input.stopId ?? null,
      ...extra,
    },
  };
}

function resolveNotificationBody(
  body: NotificationBody,
  ownerName: string
): string {
  return typeof body === "function" ? body(ownerName) : body;
}

export type NotificationSendResult = {
  /** Contacts Twilio accepted, including a timeout we later matched by lookup. */
  sent: number;
  /** Confirmed Twilio rejections. Safe to retry. */
  failed: number;
  /** Timed out or unreachable. The text may still arrive — not a retry. */
  unknown: number;
};

/**
 * Logs outbound notifications and sends SMS when Twilio is configured.
 * Never throws — driver workflow must not be blocked.
 * `sent` counts only messages Twilio accepted.
 */
export async function logNotification(
  input: LogNotificationInput
): Promise<NotificationSendResult> {
  if (!smsBudgetActive()) {
    return runWithSmsBudget(() => logNotification(input));
  }
  return perfAsync(`sms ${input.notificationType}`, async () => {
    const none: NotificationSendResult = { sent: 0, failed: 0, unknown: 0 };
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logError("sms", "Notification skipped — SUPABASE_SERVICE_ROLE_KEY missing", {
        companyId: input.companyId,
        context: { notificationType: input.notificationType, stopId: input.stopId },
      });
      return none;
    }

    try {
      const contacts = await resolveCustomerContacts(input.customerId);
      if (!contacts.length) {
        logWarn("sms", "SMS not sent — customer has no phone number", smsContext(input));
        return none;
      }

      const twilio = getTwilioConfig();
      if (!twilio) {
        logWarn("sms", "SMS not sent — Twilio is not configured", smsContext(input));
        return none;
      }

      const dogName =
      input.dogName ?? (await resolveDogName(input.dogId));

      let sent = 0;
      let failed = 0;
      let unknown = 0;
      for (const contact of contacts) {
        if (
          input.onlyPhones &&
          !input.onlyPhones.includes(contact.phone)
        ) {
          continue;
        }
        const outcome = await sendNotificationToContact(
          input,
          contact,
          twilio,
          dogName
        );
        if (outcome === "sent") sent += 1;
        else if (outcome === "unknown") unknown += 1;
        else failed += 1;
      }
      return { sent, failed, unknown };
    } catch (error) {
      logErrorFromException(
        "sms",
        "Unexpected error while sending notification",
        error,
        smsContext(input)
      );
      return { sent: 0, failed: 0, unknown: 1 };
    }
  });
}

async function sendNotificationToContact(
  input: LogNotificationInput,
  contact: { phone: string; ownerName: string },
  twilio: NonNullable<ReturnType<typeof getTwilioConfig>>,
  dogName: string | null
): Promise<"sent" | "failed" | "unknown"> {
  const supabase = createServiceClient();
  const smsBodyText = resolveNotificationBody(input.body, contact.ownerName);

  const { data: notification, error: insertError } = await supabase
    .from("notification_log")
    .insert({
      company_id: input.companyId,
      customer_id: input.customerId ?? null,
      dog_id: input.dogId ?? null,
      stop_id: input.stopId ?? null,
      notification_type: input.notificationType,
      body: smsBodyText,
      status: "pending",
      channel: "sms",
    })
    .select("id, created_at")
    .single();

  if (insertError || !notification) {
    logError("sms", "Failed to create notification_log row", {
      ...smsContext(input),
      context: {
        ...smsContext(input).context,
        dbError: insertError?.message ?? "No row returned",
        recipient: contact.phone,
      },
    });
    return "failed";
  }

  const delivery = smsDeliveryForContact(contact.phone, contact.ownerName, dogName);
  const smsBody = delivery.body + smsBodyText;
  const sendTimeout = takeSmsSlice(smsAbortTimeoutMs(input.notificationType));
  if (sendTimeout == null) {
    // Twilio was not called. Keep the row so the office can see it, but
    // night-before does not treat this as sent.
    await supabase
      .from("notification_log")
      .update({ error_message: "Skipped — request time budget exhausted" })
      .eq("id", notification.id);
    return "unknown";
  }
  const result = await sendSms(delivery.to, smsBody, { timeoutMs: sendTimeout });

  let sid: string | null = result.ok ? result.sid : null;
  let outcome: "sent" | "failed" | "unknown" = result.ok ? "sent" : result.outcome;
  let errorMessage = result.ok ? "" : result.error;

  if (!result.ok && result.outcome === "unknown") {
    const lookupTimeout = takeSmsSlice(SMS_LOOKUP_MAX_MS);
    const lookedUp =
      lookupTimeout == null
        ? { outcome: "unknown" as const }
        : await findRecentOutboundSms(
            delivery.to,
            smsBody,
            lookupTimeout,
            new Date(notification.created_at as string)
          );
    if (lookedUp.outcome === "sent") {
      sid = lookedUp.sid;
      outcome = "sent";
    } else if (lookedUp.outcome === "failed") {
      outcome = "failed";
      errorMessage = lookedUp.error;
    }
  }

  if (outcome !== "sent" || !sid) {
    if (outcome === "failed") {
      await supabase
        .from("notification_log")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", notification.id);
    } else {
      await supabase
        .from("notification_log")
        .update({
          error_message: errorMessage || "Twilio send not confirmed",
        })
        .eq("id", notification.id);
    }

    logError("sms", outcome === "failed" ? "Twilio send failed" : "Twilio send not confirmed", {
      ...smsContext(input),
      context: {
        ...smsContext(input).context,
        twilioError: errorMessage,
        to: delivery.to,
        redirected: delivery.redirected,
        intendedPhone: contact.phone,
      },
    });
    return outcome === "failed" ? "failed" : "unknown";
  }

  const { data: smsMessage, error: smsInsertError } = await supabase
    .from("sms_messages")
    .insert({
      company_id: input.companyId,
      customer_id: input.customerId ?? null,
      direction: "outbound",
      from_number: twilio.fromNumber,
      to_number: delivery.to,
      body: smsBody,
      twilio_sid: sid,
      // Twilio accepted the message — align with notification_log "sent".
      // Delivery receipts would need StatusCallback (not wired yet).
      status: "sent",
    })
    .select("id")
    .single();

  if (smsInsertError) {
    logWarn("sms", "SMS sent but sms_messages insert failed", {
      ...smsContext(input),
      context: {
        ...smsContext(input).context,
        twilioSid: sid,
        dbError: smsInsertError.message,
      },
    });
  }

  await supabase
    .from("notification_log")
    .update({
      status: "sent",
      sms_message_id: smsMessage?.id ?? null,
    })
    .eq("id", notification.id);

  return "sent";
}

export function buildEnRouteMessage(
  ownerName: string,
  dogName: string,
  stopType: "pickup" | "dropoff",
  etaMinutes?: number | null
) {
  const greeting = ownerName ? `Hi ${ownerName.split(" ")[0]}!` : "Hi!";
  const action =
    stopType === "pickup"
      ? `to pick up ${dogName}`
      : `to drop off ${dogName}`;

  if (etaMinutes != null && etaMinutes > 0) {
    const unit = etaMinutes === 1 ? "minute" : "minutes";
    return `${greeting} We're on the way ${action}. ETA is approximately ${etaMinutes} ${unit}.`;
  }
  return `${greeting} We're on the way ${action}.`;
}

export function buildArrivedMessage(
  ownerName: string,
  dogName: string,
  stopType: "pickup" | "dropoff"
) {
  const greeting = ownerName ? `Hi ${ownerName.split(" ")[0]}!` : "Hi!";
  const action =
    stopType === "pickup"
      ? `to pick up ${dogName}`
      : `to drop off ${dogName}`;
  return `${greeting} We've arrived ${action}.`;
}

export function buildPickedUpMessage(dogName: string) {
  return `${dogName} has been picked up. See you this afternoon!`;
}

export function buildDroppedOffMessage(dogName: string, photosUrl?: string | null) {
  const base = `${dogName} has been dropped off. Have a great day!`;
  return photosUrl ? `${base} Photos from the hike: ${photosUrl}` : base;
}

function formatDogList(names: string[]): string {
  if (names.length === 0) return "Your dog";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function buildNightBeforeMessage(
  ownerName: string,
  dogNames: string[],
  windowStart: string,
  windowEnd: string,
  driverFirstNames: (string | null)[] = []
) {
  const greeting = ownerName ? `Hi ${ownerName.split(" ")[0]}!` : "Hi!";
  const dogs = formatDogList(dogNames);
  const verb = dogNames.length === 1 ? "is" : "are";
  const window = `${formatTime(windowStart)} and ${formatTime(windowEnd)}`;
  const driverClause = formatNightBeforeDriverClause(dogNames, driverFirstNames);
  return `${greeting} ${dogs} ${verb} booked for a hike tomorrow and will be picked up between ${window}.${driverClause}`;
}

export function buildNightBeforeMultiWindowMessage(
  pickups: {
    dogName: string;
    windowStart: string;
    windowEnd: string;
    driverFirstName?: string | null;
  }[]
) {
  const parts = pickups.map((p) => {
    const window = `${formatTime(p.windowStart)}–${formatTime(p.windowEnd)}`;
    if (p.driverFirstName) {
      return `${p.dogName} — ${p.driverFirstName} picking up (${window})`;
    }
    return `${p.dogName} (${window})`;
  });
  return `Tomorrow's pickups: ${parts.join(", ")}.`;
}

function formatNightBeforeDriverClause(
  dogNames: string[],
  driverFirstNames: (string | null)[]
): string {
  const pairs = dogNames.map((dog, i) => ({
    dog,
    driver: driverFirstNames[i] ?? null,
  }));
  const withDriver = pairs.filter((p) => p.driver);
  if (withDriver.length === 0) return "";

  const uniqueDrivers = new Set(withDriver.map((p) => p.driver));
  if (uniqueDrivers.size === 1 && withDriver.length === dogNames.length) {
    const dogs = formatDogList(withDriver.map((p) => p.dog));
    return ` ${withDriver[0].driver} will be picking ${dogs} up.`;
  }

  const detail = withDriver
    .map((p) => `${p.driver} will be picking ${p.dog} up`)
    .join(" and ");
  return ` ${detail}.`;
}
