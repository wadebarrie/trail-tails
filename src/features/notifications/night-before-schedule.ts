import { getLocalTimeInTimezone, isPastLocalTime } from "../../lib/dates";

/** A budget skip never called Twilio. A pending row without that note may have. */
function isBudgetSkip(errorMessage: string | null): boolean {
  return (errorMessage ?? "").includes("budget exhausted");
}

export function nightBeforePriorDecision(
  rows: { status: string; errorMessage: string | null }[]
): "skip" | "send" | "confirm" {
  const pending = rows.filter((row) => row.status === "pending");
  const unconfirmed = pending.some((row) => !isBudgetSkip(row.errorMessage));
  if (unconfirmed) return "confirm";
  if (pending.some((row) => isBudgetSkip(row.errorMessage))) return "send";
  if (rows.some((row) => row.status === "sent")) return "skip";
  return "send";
}

/**
 * Who still needs a night-before text. Bodies that include the contact's
 * greeting can be told apart, so a sent primary contact does not block a
 * skipped secondary contact.
 */
export function nightBeforePhonesToSend(input: {
  contacts: { phone: string; ownerName: string }[];
  rows: { status: string; errorMessage: string | null; body: string }[];
  bodyFor: (ownerName: string) => string;
}): { phones: string[]; ambiguous: boolean } {
  const sentBodies = new Set(
    input.rows.filter((row) => row.status === "sent").map((row) => row.body)
  );
  const bodies = input.contacts.map((contact) => input.bodyFor(contact.ownerName));
  const distinct = new Set(bodies).size > 1;
  if (!distinct && sentBodies.size > 0) {
    const shared = bodies[0];
    const skips = input.rows.some(
      (row) =>
        row.status === "pending" &&
        isBudgetSkip(row.errorMessage) &&
        row.body === shared
    );
    if (skips && sentBodies.has(shared)) {
      return { phones: [], ambiguous: true };
    }
  }
  if (sentBodies.size === 0) {
    return {
      phones: input.contacts.map((contact) => contact.phone),
      ambiguous: false,
    };
  }
  return {
    phones: input.contacts
      .filter((contact) => !sentBodies.has(input.bodyFor(contact.ownerName)))
      .map((contact) => contact.phone),
    ambiguous: false,
  };
}

/**
 * Whether this instant should send night-before texts.
 * Cron runs on a UTC clock; eligibility is always the company's local time.
 * Sends start at the configured clock time and stop at local midnight so a
 * morning retry cannot text owners overnight.
 */
export function nightBeforeSendDecision(
  timeZone: string,
  reminderTime: string,
  at = new Date()
):
  | { send: true }
  | { send: false; reason: "morning_sync" | "before_reminder_time" } {
  const localTime = getLocalTimeInTimezone(timeZone, at);
  if (localTime.hour === 5) {
    return { send: false, reason: "morning_sync" };
  }
  if (!isPastLocalTime(timeZone, reminderTime, at)) {
    return { send: false, reason: "before_reminder_time" };
  }
  return { send: true };
}
