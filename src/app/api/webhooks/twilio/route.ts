import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException, logWarn } from "@/lib/logger";
import {
  emptyTwimlResponse,
  getTwilioConfig,
  parseTwilioWebhookBody,
  validateTwilioSignature,
} from "@/lib/twilio";

/** MVP single-company fallback when inbound phone is not matched. */
const DEFAULT_COMPANY_ID = "a0000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  const config = getTwilioConfig();
  if (!config) {
    logWarn("webhook", "Twilio webhook hit but Twilio is not configured");
    return new Response("Twilio not configured", { status: 503 });
  }

  const params = await parseTwilioWebhookBody(request);
  const signature = request.headers.get("X-Twilio-Signature") ?? "";
  const webhookUrl =
    process.env.TWILIO_WEBHOOK_URL ?? new URL(request.url).toString();

  if (
    !validateTwilioSignature(
      config.authToken,
      signature,
      webhookUrl,
      params
    )
  ) {
    logWarn("webhook", "Twilio webhook rejected — invalid signature");
    return new Response("Invalid signature", { status: 403 });
  }

  const fromNumber = params.From ?? "";
  const toNumber = params.To ?? config.fromNumber;
  const body = params.Body ?? "";
  const twilioSid = params.MessageSid ?? null;

  if (!fromNumber || !body) {
    return emptyTwimlResponse();
  }

  try {
    const supabase = createServiceClient();

    const { data: customer } = await supabase
      .from("customers")
      .select("id, company_id")
      .eq("phone", fromNumber)
      .maybeSingle();

    const companyId = customer?.company_id ?? DEFAULT_COMPANY_ID;

    if (twilioSid) {
      const { data: existing } = await supabase
        .from("sms_messages")
        .select("id")
        .eq("twilio_sid", twilioSid)
        .maybeSingle();

      if (existing) {
        return emptyTwimlResponse();
      }
    }

    await supabase.from("sms_messages").insert({
      company_id: companyId,
      customer_id: customer?.id ?? null,
      direction: "inbound",
      from_number: fromNumber,
      to_number: toNumber,
      body,
      twilio_sid: twilioSid,
      status: "received",
    });
  } catch (error) {
    logErrorFromException("webhook", "Failed to persist inbound SMS", error, {
      companyId: DEFAULT_COMPANY_ID,
      context: { fromNumber, twilioSid },
    });
  }

  // Phase 10: parse commands and create pending_requests
  return emptyTwimlResponse();
}
