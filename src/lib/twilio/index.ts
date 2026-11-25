import { createHmac, timingSafeEqual } from "node:crypto";
import { perfAsync } from "@/lib/perf";
import {
  fetchFailureOutcome,
  outboundBodyMatches,
  twilioMessageIsAccepted,
  twilioMessageIsFailed,
} from "@/lib/twilio/outcome";

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

/** When set, all outbound SMS go here instead of the customer phone (pilot/testing).
 *  In production this only applies when TWILIO_ALLOW_SMS_REDIRECT=true — otherwise
 *  live customer numbers would be silently redirected. */
export function getSmsRedirectTo(): string | null {
  const redirect = process.env.TWILIO_SMS_REDIRECT_TO?.trim();
  if (!redirect) return null;
  if (process.env.NODE_ENV === "production") {
    if (process.env.TWILIO_ALLOW_SMS_REDIRECT !== "true") return null;
  }
  return redirect;
}

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; outcome: "failed"; error: string }
  | { ok: false; outcome: "unknown"; error: string };

/**
 * Send an outbound SMS via Twilio REST API.
 * `timeoutMs: null` waits for Twilio (driver texts). A number aborts the HTTP
 * call only — that is "unknown", not a confirmed failure, because Twilio may
 * still have accepted the message.
 */
export async function sendSms(
  to: string,
  body: string,
  options?: { timeoutMs?: number | null }
): Promise<SendSmsResult> {
  return perfAsync("twilio send", async () => {
    const config = getTwilioConfig();
    if (!config) {
      return { ok: false, outcome: "failed", error: "Twilio is not configured" };
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

    const timeoutMs = options?.timeoutMs;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal:
          timeoutMs != null && timeoutMs > 0
            ? AbortSignal.timeout(timeoutMs)
            : undefined,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      const outcome = fetchFailureOutcome(name);
      return {
        ok: false,
        outcome,
        error:
          outcome === "unknown" ? "Twilio send not confirmed" : "Twilio send failed",
      };
    }

    const data = (await response.json()) as { sid?: string; message?: string };

    if (!response.ok) {
      return {
        ok: false,
        outcome: "failed",
        error: data.message ?? "Twilio send failed",
      };
    }

    if (!data.sid) {
      return {
        ok: false,
        outcome: "unknown",
        error: "Twilio response missing message SID",
      };
    }

    return { ok: true, sid: data.sid };
  });
}

type TwilioMessageRow = {
  sid?: string;
  body?: string;
  status?: string;
  direction?: string;
};

/**
 * After an aborted create, look up whether Twilio already accepted this text.
 * Matched accepted/queued/sent messages count as sent. Only failed/undelivered
 * counts as a confirmed failure.
 */
export async function findRecentOutboundSms(
  to: string,
  body: string
): Promise<
  | { outcome: "sent"; sid: string }
  | { outcome: "failed"; error: string }
  | { outcome: "unknown" }
> {
  const config = getTwilioConfig();
  if (!config || !body) return { outcome: "unknown" };

  const url = new URL(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
  );
  url.searchParams.set("To", to);
  url.searchParams.set("From", config.fromNumber);
  url.searchParams.set("PageSize", "20");
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
    "base64"
  );

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { outcome: "unknown" };
    const data = (await response.json()) as { messages?: TwilioMessageRow[] };
    const matches = (data.messages ?? []).filter(
      (message) =>
        (message.direction ?? "").includes("outbound") &&
        outboundBodyMatches(message.body ?? "", body)
    );
    const accepted = matches.find((message) =>
      twilioMessageIsAccepted(message.status ?? "")
    );
    if (accepted?.sid) return { outcome: "sent", sid: accepted.sid };
    const failed = matches.find((message) =>
      twilioMessageIsFailed(message.status ?? "")
    );
    if (failed) {
      return { outcome: "failed", error: `Twilio status ${failed.status}` };
    }
    return { outcome: "unknown" };
  } catch {
    return { outcome: "unknown" };
  }
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
  return twimlMessagesResponse([body]);
}

/** Reply with one or more SMS bodies (Twilio sends each as a separate message). */
export function twimlMessagesResponse(bodies: string[]): Response {
  const messages = bodies
    .filter((body) => body.trim().length > 0)
    .map((body) => `<Message>${escapeXml(body)}</Message>`)
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${messages}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
