/** Gallery texts abort sooner so a close-out can still finish. */
export const GALLERY_SMS_TIMEOUT_MS = 8_000;

/**
 * Driver texts (drop-off, on the way, and the rest) get a longer cap so a
 * hung Twilio call cannot run until the Netlify limit and skip the gallery
 * text in the same request. A timeout is still "unknown", not a failure.
 */
export const DRIVER_SMS_TIMEOUT_MS = 15_000;

export function smsAbortTimeoutMs(notificationType: string): number {
  return notificationType === "hike_photos"
    ? GALLERY_SMS_TIMEOUT_MS
    : DRIVER_SMS_TIMEOUT_MS;
}

/**
 * Same To and body prefix the live send uses, including the test-redirect
 * number and `[Name]` prefix when one is configured.
 */
export function resolveSmsDelivery(
  customerPhone: string,
  ownerName: string,
  dogName: string | null,
  redirectTo: string | null
): { to: string; bodyPrefix: string; redirected: boolean } {
  if (!redirectTo) {
    return { to: customerPhone, bodyPrefix: "", redirected: false };
  }
  const label = [ownerName.split(" ")[0], dogName].filter(Boolean).join(" / ");
  const bodyPrefix = label ? `[${label}] ` : "[TEST] ";
  return { to: redirectTo, bodyPrefix, redirected: true };
}

/** Gallery texts are sent with no dog name, so the prefix is owner-only. */
export function galleryWireMessage(input: {
  phone: string;
  ownerName: string;
  loggedBody: string;
  redirectTo: string | null;
}): { to: string; body: string } {
  const delivery = resolveSmsDelivery(
    input.phone,
    input.ownerName,
    null,
    input.redirectTo
  );
  return { to: delivery.to, body: delivery.bodyPrefix + input.loggedBody };
}

/** Only a confirmed Twilio failure may be resent. Unknown stays pending. */
export function abandonedLookupAllowsRetry(
  outcome: "sent" | "failed" | "unknown"
): boolean {
  return outcome === "failed";
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
