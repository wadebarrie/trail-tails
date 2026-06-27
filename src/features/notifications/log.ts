import { listCustomerContacts } from "@/lib/customer-contacts";
import { formatTime } from "@/lib/dates";
import { createServiceClient } from "@/lib/supabase/service";
import { logError, logErrorFromException, logWarn } from "@/lib/logger";
import { getSmsRedirectTo, getTwilioConfig, sendSms } from "@/lib/twilio";
import type { NotificationType } from "@/types";

type NotificationBody = string | ((ownerName: string) => string);

type LogNotificationInput = {
  companyId: string;
  customerId?: string;
  dogId?: string;
  stopId?: string;
  notificationType: NotificationType;
  body: NotificationBody;
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

function resolveSmsDelivery(
  customerPhone: string,
  ownerName: string,
  dogName: string | null
): { to: string; body: string; redirected: boolean } {
  const redirectTo = getSmsRedirectTo();
  if (!redirectTo) {
    return { to: customerPhone, body: "", redirected: false };
  }

  const label = [ownerName.split(" ")[0], dogName].filter(Boolean).join(" / ");
  const prefix = label ? `[${label}] ` : "[TEST] ";
  return { to: redirectTo, body: prefix, redirected: true };
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

/**
 * Logs outbound notifications and sends SMS when Twilio is configured.
 * Never throws — driver workflow must not be blocked.
 */
export async function logNotification(input: LogNotificationInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logError("sms", "Notification skipped — SUPABASE_SERVICE_ROLE_KEY missing", {
      companyId: input.companyId,
      context: { notificationType: input.notificationType, stopId: input.stopId },
    });
    return;
  }

  try {
    const contacts = await resolveCustomerContacts(input.customerId);
    if (!contacts.length) {
      logWarn("sms", "SMS not sent — customer has no phone number", smsContext(input));
      return;
    }

    const twilio = getTwilioConfig();
    if (!twilio) {
      logWarn("sms", "SMS not sent — Twilio is not configured", smsContext(input));
      return;
    }

    const dogName = await resolveDogName(input.dogId);

    for (const contact of contacts) {
      await sendNotificationToContact(input, contact, twilio, dogName);
    }
  } catch (error) {
    logErrorFromException(
      "sms",
      "Unexpected error while sending notification",
      error,
      smsContext(input)
    );
  }
}

async function sendNotificationToContact(
  input: LogNotificationInput,
  contact: { phone: string; ownerName: string },
  twilio: NonNullable<ReturnType<typeof getTwilioConfig>>,
  dogName: string | null
) {
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
    .select("id")
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
    return;
  }

  const delivery = resolveSmsDelivery(contact.phone, contact.ownerName, dogName);
  const smsBody = delivery.body + smsBodyText;
  const result = await sendSms(delivery.to, smsBody);

  if (!result.ok) {
    await supabase
      .from("notification_log")
      .update({
        status: "failed",
        error_message: result.error,
      })
      .eq("id", notification.id);

    logError("sms", "Twilio send failed", {
      ...smsContext(input),
      context: {
        ...smsContext(input).context,
        twilioError: result.error,
        to: delivery.to,
        redirected: delivery.redirected,
        intendedPhone: contact.phone,
      },
    });
    return;
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
      twilio_sid: result.sid,
      status: "queued",
    })
    .select("id")
    .single();

  if (smsInsertError) {
    logWarn("sms", "SMS sent but sms_messages insert failed", {
      ...smsContext(input),
      context: {
        ...smsContext(input).context,
        twilioSid: result.sid,
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
    return `${greeting} We're on the way ${action}. ETA is approximately ${etaMinutes} minutes.`;
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

export function buildDroppedOffMessage(dogName: string) {
  return `${dogName} has been dropped off. Have a great day!`;
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
  windowEnd: string
) {
  const greeting = ownerName ? `Hi ${ownerName.split(" ")[0]}!` : "Hi!";
  const dogs = formatDogList(dogNames);
  const verb = dogNames.length === 1 ? "is" : "are";
  const window = `${formatTime(windowStart)} and ${formatTime(windowEnd)}`;
  return `${greeting} ${dogs} ${verb} booked for a hike tomorrow and will be picked up between ${window}.`;
}
