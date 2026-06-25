import { createHmac, timingSafeEqual } from "node:crypto";

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export function isTwilioConfigured(): boolean {
  return getTwilioConfig() != null;
}

type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

/** Send an outbound SMS via Twilio REST API. */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  const config = getTwilioConfig();
  if (!config) {
    return { ok: false, error: "Twilio is not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
    "base64"
  );

  const params = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = (await response.json()) as { sid?: string; message?: string };

  if (!response.ok) {
    return { ok: false, error: data.message ?? "Twilio send failed" };
  }

  if (!data.sid) {
    return { ok: false, error: "Twilio response missing message SID" };
  }

  return { ok: true, sid: data.sid };
}

/** Validate X-Twilio-Signature on inbound webhook requests. */
export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false;

  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }

  const expected = createHmac("sha1", authToken)
    .update(payload, "utf8")
    .digest("base64");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Parse application/x-www-form-urlencoded webhook body into a param map. */
export async function parseTwilioWebhookBody(
  request: Request
): Promise<Record<string, string>> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  return params;
}

export function emptyTwimlResponse(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Reply to inbound SMS via TwiML (no separate REST send). */
export function twimlMessageResponse(body: string): Response {
  const message = escapeXml(body);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
