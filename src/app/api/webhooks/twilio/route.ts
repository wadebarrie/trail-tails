import { createServiceClient } from "@/lib/supabase/service";
import { logErrorFromException, logWarn } from "@/lib/logger";
import { processInboundSms } from "@/features/sms/process-inbound";
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logWarn("webhook", "Inbound SMS skipped — SUPABASE_SERVICE_ROLE_KEY missing");
    return emptyTwimlResponse();
  }

  return processInboundSms({
    fromNumber,
    toNumber,
    body,
    twilioSid,
    defaultCompanyId: DEFAULT_COMPANY_ID,
  });
}
