/** Gallery texts abort sooner so a close-out can still finish. */
export const GALLERY_SMS_TIMEOUT_MS = 8_000;

/**
 * Driver texts (drop-off, on the way, and the rest) get a longer cap so a
 * hung Twilio call cannot run until the Netlify limit and skip the gallery
 * text in the same request. A timeout is still "unknown", not a failure.
 */
export const DRIVER_SMS_TIMEOUT_MS = 15_000;

/** One close-out or one company's night-before pass. */
export const SMS_REQUEST_BUDGET_MS = 20_000;

/** Whole night-before cron, still under Netlify's ~26s limit. */
export const NIGHT_BEFORE_CRON_BUDGET_MS = 24_000;

/** Child budget cannot outlive the parent request. */
export function nestedBudgetMs(
  requestedMs: number,
  parentRemainingMs: number | null
): number {
  if (parentRemainingMs == null) return requestedMs;
  return Math.min(requestedMs, Math.max(0, parentRemainingMs));
}

/** Don't start a Twilio call with less than this left. */
export const SMS_CALL_FLOOR_MS = 1_000;

/** Post-abort message lookup. Skipped when the request budget is below the floor. */
export const SMS_LOOKUP_MAX_MS = 5_000;

/**
 * How long this Twilio call may run. `remainingMs: null` means no shared
 * budget, so the per-call cap is used. Otherwise the call gets what's left
 * after `reserveMs`, and null means skip it.
 */
export function smsSliceMs(input: {
  remainingMs: number | null;
  requestedMs: number;
  reserveMs?: number;
  floorMs?: number;
}): number | null {
  const floor = input.floorMs ?? SMS_CALL_FLOOR_MS;
  if (input.remainingMs == null) return input.requestedMs;
  const available = input.remainingMs - (input.reserveMs ?? 0);
  if (available < floor) return null;
  return Math.min(input.requestedMs, available);
}

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

/** Ignore messages from before this attempt. Missing timestamps do not match. */
export function twilioMessageIsAfter(
  dateSent: string | undefined,
  dateCreated: string | undefined,
  sentAfter: Date | undefined
): boolean {
  if (!sentAfter) return true;
  const raw = dateSent || dateCreated;
  if (!raw) return false;
  const at = Date.parse(raw);
  if (Number.isNaN(at)) return false;
  return at >= sentAfter.getTime();
}

/** Test redirects prefix the body; the logged text is still the suffix. */
export function outboundBodyMatches(actual: string, expected: string): boolean {
  if (!expected) return false;
  return actual === expected || actual.endsWith(expected);
}
