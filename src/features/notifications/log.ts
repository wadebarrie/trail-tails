import { createServiceClient } from "@/lib/supabase/service";
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

/**
 * Logs outbound notifications and sends SMS when Twilio is configured.
 * Never throws — driver workflow must not be blocked.
 */
export async function logNotification(input: LogNotificationInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createServiceClient();

    const { data: notification, error: logError } = await supabase
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

    if (logError || !notification) return;

    const twilio = getTwilioConfig();
    if (!twilio) return;

    const phone = await resolveCustomerPhone(input.customerId);
    if (!phone) {
      await supabase
        .from("notification_log")
        .update({
          status: "failed",
          error_message: "Customer has no phone number",
        })
        .eq("id", notification.id);
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
      return;
    }

    const { data: smsMessage } = await supabase
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

    await supabase
      .from("notification_log")
      .update({
        status: "sent",
        sms_message_id: smsMessage?.id ?? null,
      })
      .eq("id", notification.id);
  } catch {
    // Notifications must not block driver workflow
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
