import { createServiceClient } from "@/lib/supabase/service";
import { logError, logErrorFromException, logWarn } from "@/lib/logger";
import { getTwilioConfig, sendSms } from "@/lib/twilio";
import type { NotificationType } from "@/types";

type LogNotificationInput = {
  companyId: string;
  customerId?: string;
  dogId?: string;
  stopId?: string;
  notificationType: NotificationType;
  body: string;
};

async function resolveCustomerPhone(
  customerId: string | undefined
): Promise<string | null> {
  if (!customerId) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("customers")
    .select("phone")
    .eq("id", customerId)
    .maybeSingle();

  return data?.phone ?? null;
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
    const supabase = createServiceClient();

    const { data: notification, error: insertError } = await supabase
      .from("notification_log")
      .insert({
        company_id: input.companyId,
        customer_id: input.customerId ?? null,
        dog_id: input.dogId ?? null,
        stop_id: input.stopId ?? null,
        notification_type: input.notificationType,
        body: input.body,
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
        },
      });
      return;
    }

    const twilio = getTwilioConfig();
    if (!twilio) {
      await supabase
        .from("notification_log")
        .update({
          status: "failed",
          error_message: "Twilio is not configured",
        })
        .eq("id", notification.id);

      logWarn("sms", "SMS not sent — Twilio is not configured", smsContext(input));
      return;
    }

    const phone = await resolveCustomerPhone(input.customerId);
    if (!phone) {
      await supabase
        .from("notification_log")
        .update({
          status: "failed",
          error_message: "Customer has no phone number",
        })
        .eq("id", notification.id);

      logWarn("sms", "SMS not sent — customer has no phone number", smsContext(input));
      return;
    }

    const result = await sendSms(phone, input.body);

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
        context: { ...smsContext(input).context, twilioError: result.error, to: phone },
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
        to_number: phone,
        body: input.body,
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
  } catch (error) {
    logErrorFromException(
      "sms",
      "Unexpected error while sending notification",
      error,
      smsContext(input)
    );
  }
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
