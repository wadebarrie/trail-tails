import { getLocalTimeInTimezone, isPastLocalTime } from "../../lib/dates";
import { SMS_CALL_FLOOR_MS } from "../../lib/twilio/outcome";

/** A budget skip never called Twilio. A pending row without that note may have. */
function isBudgetSkip(errorMessage: string | null): boolean {
  return (errorMessage ?? "").includes("budget exhausted");
}

/** Parent cron budget is too small to sync or text another company. */
export function nightBeforeBudgetExhausted(remainingMs: number | null): boolean {
  return remainingMs != null && remainingMs < SMS_CALL_FLOOR_MS;
}

type NightBeforeContact = { phone: string; ownerName: string };

type NightBeforeConfirmRow = {
  id: string;
  status: string;
  errorMessage: string | null;
  body: string;
  createdAt?: string;
};

export type NightBeforeConfirmMatch = {
  rowId: string;
  phone: string;
  ownerName: string;
  body: string;
  createdAt?: string;
};

export type NightBeforeSharedConfirm = {
  body: string;
  rowIds: string[];
  contacts: NightBeforeContact[];
  createdAt?: string;
};

function contactsForBody(
  contacts: NightBeforeContact[],
  body: string,
  bodyFor: (ownerName: string) => string
): NightBeforeContact[] {
  return contacts.filter((contact) => bodyFor(contact.ownerName) === body);
}

function earliestCreatedAt(values: (string | undefined)[]): string | undefined {
  let best: number | null = null;
  let raw: string | undefined;
  for (const value of values) {
    if (!value) continue;
    const at = Date.parse(value);
    if (Number.isNaN(at)) continue;
    if (best == null || at < best) {
      best = at;
      raw = value;
    }
  }
  return raw;
}

/**
 * Unconfirmed rows paired to one contact by message body.
 * A body shared by two contacts is not paired, so one sent lookup cannot
 * mark the other contact's row sent.
 */
export function nightBeforeConfirmPlan(input: {
  contacts: NightBeforeContact[];
  rows: NightBeforeConfirmRow[];
  bodyFor: (ownerName: string) => string;
}): { unique: NightBeforeConfirmMatch[]; shared: NightBeforeSharedConfirm[] } {
  const unique: NightBeforeConfirmMatch[] = [];
  const sharedByBody = new Map<string, NightBeforeConfirmRow[]>();

  for (const row of input.rows) {
    if (row.status !== "pending" || isBudgetSkip(row.errorMessage)) continue;
    const matches = contactsForBody(input.contacts, row.body, input.bodyFor);
    if (matches.length === 1) {
      unique.push({
        rowId: row.id,
        phone: matches[0].phone,
        ownerName: matches[0].ownerName,
        body: row.body,
        createdAt: row.createdAt,
      });
      continue;
    }
    if (matches.length > 1) {
      const group = sharedByBody.get(row.body) ?? [];
      group.push(row);
      sharedByBody.set(row.body, group);
    }
  }

  const shared: NightBeforeSharedConfirm[] = [];
  for (const [body, group] of sharedByBody) {
    shared.push({
      body,
      rowIds: group.map((row) => row.id),
      contacts: contactsForBody(input.contacts, body, input.bodyFor),
      createdAt: earliestCreatedAt(group.map((row) => row.createdAt)),
    });
  }
  return { unique, shared };
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
