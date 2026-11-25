/** Gallery texts may abort; driver texts wait for Twilio's own response. */
export const GALLERY_SMS_TIMEOUT_MS = 8_000;

export function smsAbortTimeoutMs(notificationType: string): number | null {
  return notificationType === "hike_photos" ? GALLERY_SMS_TIMEOUT_MS : null;
}

/** Aborting the HTTP call does not prove Twilio rejected the message. */
export function fetchFailureOutcome(errorName: string): "unknown" | "failed" {
  if (
    errorName === "TimeoutError" ||
    errorName === "AbortError" ||
    errorName === "TypeError"
  ) {
    return "unknown";
  }
  return "failed";
}

const ACCEPTED_TWILIO_STATUSES = new Set([
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
]);

export function twilioMessageIsAccepted(status: string): boolean {
  return ACCEPTED_TWILIO_STATUSES.has(status);
}

export function twilioMessageIsFailed(status: string): boolean {
  return status === "failed" || status === "undelivered";
}

/** Test redirects prefix the body; the logged text is still the suffix. */
export function outboundBodyMatches(actual: string, expected: string): boolean {
  if (!expected) return false;
  return actual === expected || actual.endsWith(expected);
}
