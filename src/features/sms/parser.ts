import { createHash } from "node:crypto";
import type { CommandType } from "@/types";
import { getDateInTimezone } from "@/lib/dates";

export type ParsedPayload = {
  target_date?: string;
  day_of_week?: number;
  start_date?: string;
  end_date?: string | null;
};

export type ParseResult =
  | {
      commandType: "help" | "unknown";
      payload: ParsedPayload;
      autoReply: string;
      autoReplies?: string[];
      createsRequest: false;
    }
  | {
      commandType: "reminders_preference";
      payload: ParsedPayload;
      autoReply: string;
      createsRequest: false;
      nightBeforeRemindersEnabled: boolean;
    }
  | {
      commandType: Exclude<CommandType, "help" | "unknown">;
      payload: ParsedPayload;
      autoReply: string;
      createsRequest: true;
    };

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTH_NAMES: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

export const HELP_REPLIES = [
  `PackRoute - text us natural language or keywords:
SKIP TOMORROW / NO HIKE TOMORROW
SKIP MONDAY (or any weekday)
SKIP NEXT HIKE / SKIP NEXT WEEK
SKIP 7/10 or SKIP JULY 10`,
  `GOING ON VACATION UNTIL JULY 18
VACATION JULY 10-18 / AWAY JULY 10 TO 18
PAUSE / TAKE A BREAK
RESUME / BACK ON
STOP REMINDERS / START REMINDERS`,
  `Schedule changes are reviewed by the office before they take effect.`,
];

export const REMINDERS_OFF_REPLY =
  "Night-before reminder texts are off. You'll still get ETA and pickup/drop-off updates when your dog is on the schedule. Text START REMINDERS to turn reminders back on.";

export const REMINDERS_ON_REPLY =
  "Night-before reminder texts are on. You'll get a text around 6 PM the day before each scheduled pickup. Text STOP REMINDERS to opt out.";

export const HELP_REPLY = HELP_REPLIES.join("\n\n");

export const UNKNOWN_REPLY = `We didn't recognize that. Reply HELP for options, or try "skip tomorrow", "going on vacation until July 18", or "pause".`;

export const REQUEST_ACK_REPLY =
  "Got it! We'll review your request shortly.";

export const UNREGISTERED_PHONE_REPLY =
  "We don't recognize this number. Please contact the office for help.";

function normalizeBody(body: string): string {
  return body
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function buildIdempotencyKey(
  fromNumber: string,
  body: string,
  receivedAt: Date
): string {
  const minuteBucket = Math.floor(receivedAt.getTime() / 60_000);
  const normalized = normalizeBody(body);
  return createHash("sha256")
    .update(`${fromNumber}:${normalized}:${minuteBucket}`)
    .digest("hex");
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Next calendar date matching day_of_week on or after startDate. */
export function nextDateForWeekday(
  startDate: string,
  dayOfWeek: number
): string {
  let cursor = startDate;
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${cursor}T12:00:00`);
    if (d.getUTCDay() === dayOfWeek) return cursor;
    cursor = addDays(cursor, 1);
  }
  return startDate;
}

/** Mon-Fri of the next calendar week (colloquial "next week"). */
export function nextWeekdayWeekRange(today: string): {
  start_date: string;
  end_date: string;
} {
  const d = new Date(`${today}T12:00:00`);
  const dow = d.getUTCDay();
  let daysToMonday = (8 - dow) % 7;
  if (daysToMonday === 0) daysToMonday = 7;
  const start = addDays(today, daysToMonday);
  return { start_date: start, end_date: addDays(start, 4) };
}

function parseIsoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const check = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(check.getTime())) return null;
  if (check.getUTCMonth() + 1 !== m || check.getUTCDate() !== d) return null;
  return iso;
}

function parseMonthDay(
  text: string,
  referenceYear: number
): { start: string; end: string | null } | null {
  const cleaned = text.trim().replace(/\.$/, "");

  const range = cleaned.match(
    /^([A-Z]+)\s+(\d{1,2})\s*(?:-|TO|THROUGH)\s*(?:([A-Z]+)\s+)?(\d{1,2})$/i
  );
  if (range) {
    const m1 = MONTH_NAMES[range[1].toLowerCase()];
    const d1 = Number(range[2]);
    const m2 = range[3] ? MONTH_NAMES[range[3].toLowerCase()] : m1;
    const d2 = Number(range[4]);
    if (!m1 || !m2) return null;
    const start = parseIsoDate(referenceYear, m1, d1);
    const end = parseIsoDate(referenceYear, m2, d2);
    if (!start || !end) return null;
    return { start, end: end >= start ? end : null };
  }

  const single = cleaned.match(/^([A-Z]+)\s+(\d{1,2})$/i);
  if (single) {
    const m = MONTH_NAMES[single[1].toLowerCase()];
    const d = Number(single[2]);
    if (!m) return null;
    const start = parseIsoDate(referenceYear, m, d);
    if (!start) return null;
    return { start, end: start };
  }

  const numeric = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (numeric) {
    const m = Number(numeric[1]);
    const d = Number(numeric[2]);
    let y = referenceYear;
    if (numeric[3]) {
      y = Number(numeric[3]);
      if (y < 100) y += 2000;
    }
    const start = parseIsoDate(y, m, d);
    if (!start) return null;
    return { start, end: start };
  }

  return null;
}

function isHelpCommand(normalized: string): boolean {
  if (!normalized) return false;
  if (/^(HELP|\?|COMMANDS|OPTIONS|MENU|INFO)$/.test(normalized)) return true;
  if (/^HELP\b/.test(normalized)) return true;
  if (/^(HOW DO I|WHAT CAN I TEXT|NEED HELP|TEXT HELP)/.test(normalized)) {
    return true;
  }
  return false;
}

function helpResult(): ParseResult {
  return {
    commandType: "help",
    payload: {},
    autoReply: HELP_REPLY,
    autoReplies: HELP_REPLIES,
    createsRequest: false,
  };
}

function requestResult(
  commandType: Exclude<CommandType, "help" | "unknown">,
  payload: ParsedPayload
): ParseResult {
  return {
    commandType,
    payload,
    autoReply: REQUEST_ACK_REPLY,
    createsRequest: true,
  };
}

function tryParseVacation(
  normalized: string,
  today: string,
  refYear: number
): ParseResult | null {
  const hasVacationWord =
    /\b(VACATION|AWAY|OUT OF TOWN)\b/.test(normalized) ||
    /GOING ON VACATION/.test(normalized);

  const between = normalized.match(
    /(?:VACATION|AWAY|OUT OF TOWN)?\s*BETWEEN\s+(.+?)\s+AND\s+(.+)$/i
  );
  if (between) {
    const start = parseMonthDay(between[1], refYear);
    const end = parseMonthDay(between[2], refYear);
    if (start?.start && end?.start) {
      return requestResult("vacation", {
        start_date: start.start,
        end_date: end.end ?? end.start,
      });
    }
  }

  const fromTo = normalized.match(
    /(?:GOING ON |ON )?(?:VACATION|AWAY|OUT OF TOWN)\s+(?:FROM\s+)?(.+?)\s+(?:TO|UNTIL|THROUGH|-)\s+(.+)$/i
  );
  if (fromTo) {
    const start = parseMonthDay(fromTo[1], refYear);
    const end = parseMonthDay(fromTo[2], refYear);
    if (start?.start && end?.start) {
      return requestResult("vacation", {
        start_date: start.start,
        end_date: end.end ?? end.start,
      });
    }
  }

  const until = normalized.match(
    /(?:GOING ON |ON |I'M ON |WE'RE ON |WE ARE ON )?(?:VACATION|AWAY|OUT OF TOWN)\s+UNTIL\s+(.+)$/i
  );
  if (until) {
    const end = parseMonthDay(until[1], refYear);
    if (end?.start) {
      return requestResult("vacation", {
        start_date: today,
        end_date: end.end ?? end.start,
      });
    }
  }

  if (normalized.startsWith("VACATION ")) {
    const rest = normalized.slice("VACATION ".length);
    const parsed = parseMonthDay(rest, refYear);
    if (parsed) {
      return requestResult("vacation", {
        start_date: parsed.start,
        end_date: parsed.end,
      });
    }
  }

  if (normalized.startsWith("AWAY ")) {
    const rest = normalized.slice("AWAY ".length);
    const parsed = parseMonthDay(rest, refYear);
    if (parsed) {
      return requestResult("vacation", {
        start_date: parsed.start,
        end_date: parsed.end,
      });
    }
  }

  if (hasVacationWord) {
    const trailingUntil = normalized.match(/\bUNTIL\s+(.+)$/i);
    if (trailingUntil) {
      const end = parseMonthDay(trailingUntil[1], refYear);
      if (end?.start) {
        return requestResult("vacation", {
          start_date: today,
          end_date: end.end ?? end.start,
        });
      }
    }
  }

  return null;
}

function tryParseSkip(normalized: string, today: string, refYear: number): ParseResult | null {
  if (
    normalized === "SKIP TOMORROW" ||
    /^SKIP\s+(THE\s+)?(NEXT\s+)?(HIKE|WALK)\s*$/.test(normalized) ||
    /^(NO|CANCEL|SKIP)\s+(THE\s+)?(HIKE|WALK)\s+TOMORROW$/.test(normalized) ||
    /^(NO|CANCEL)\s+(HIKE|WALK)\s+TOMORROW$/.test(normalized) ||
    /^NO\s+(HIKES?|WALKS?)\s+TOMORROW$/.test(normalized)
  ) {
    return requestResult("skip_tomorrow", {
      target_date: addDays(today, 1),
    });
  }

  if (
    /^SKIP\s+(THE\s+)?NEXT\s+WEEK\b/.test(normalized) ||
    /^NO\s+(HIKES?|WALKS?)\s+NEXT\s+WEEK$/.test(normalized) ||
    /^OFF\s+NEXT\s+WEEK$/.test(normalized)
  ) {
    const range = nextWeekdayWeekRange(today);
    return requestResult("vacation", range);
  }

  const skipWeekday = normalized.match(
    /^SKIP\s+(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|TUES|WED|THU|THUR|THURS|FRI|SAT|SUN)$/
  );
  if (skipWeekday) {
    const dow = WEEKDAY_NAMES[skipWeekday[1].toLowerCase()];
    if (dow == null) return null;
    return requestResult("skip_weekday", {
      day_of_week: dow,
      target_date: nextDateForWeekday(today, dow),
    });
  }

  if (normalized.startsWith("SKIP ")) {
    const rest = normalized.slice("SKIP ".length);
    const parsed = parseMonthDay(rest, refYear);
    if (parsed?.start) {
      return requestResult("skip_date", { target_date: parsed.start });
    }
  }

  return null;
}

function tryParseReminderPreference(normalized: string): ParseResult | null {
  if (
    /^(STOP|NO|TURN OFF|OPT OUT OF|UNSUBSCRIBE FROM)\s+(NIGHT\s*BEFORE\s*)?REMINDERS?$/.test(
      normalized
    ) ||
    /^REMINDERS?\s+OFF$/.test(normalized) ||
    /^NO\s+(MORE\s+)?REMINDERS?$/.test(normalized) ||
    /^DON'?T\s+(SEND\s+)?REMINDERS?$/.test(normalized)
  ) {
    return {
      commandType: "reminders_preference",
      payload: {},
      autoReply: REMINDERS_OFF_REPLY,
      createsRequest: false,
      nightBeforeRemindersEnabled: false,
    };
  }

  if (
    /^(START|TURN ON|SUBSCRIBE TO)\s+(NIGHT\s*BEFORE\s*)?REMINDERS?$/.test(
      normalized
    ) ||
    /^REMINDERS?\s+(ON|BACK ON)$/.test(normalized)
  ) {
    return {
      commandType: "reminders_preference",
      payload: {},
      autoReply: REMINDERS_ON_REPLY,
      createsRequest: false,
      nightBeforeRemindersEnabled: true,
    };
  }

  return null;
}

function tryParsePauseResume(normalized: string, today: string): ParseResult | null {
  if (
    normalized === "PAUSE" ||
    /^PAUSE\s+(HIKES?|WALKS?)$/.test(normalized) ||
    /^TAKE\s+A\s+BREAK$/.test(normalized) ||
    /^STOP\s+(HIKES?|WALKS?)$/.test(normalized) ||
    /^UNAVAILABLE$/.test(normalized)
  ) {
    return requestResult("pause", { start_date: today, end_date: null });
  }

  if (
    normalized === "RESUME" ||
    normalized === "BACK ON" ||
    /^RESUME\s+(HIKES?|WALKS?)$/.test(normalized) ||
    /^START\s+AGAIN$/.test(normalized) ||
    /^BACK\s+ON\s+(HIKES?|WALKS?)$/.test(normalized)
  ) {
    return requestResult("resume", { start_date: today });
  }

  return null;
}

export function parseSmsCommand(
  body: string,
  timeZone: string,
  referenceDate?: string
): ParseResult {
  const today = referenceDate ?? getDateInTimezone(timeZone, 0);
  const refYear = Number(today.slice(0, 4));
  const normalized = normalizeBody(body);

  if (!normalized) {
    return {
      commandType: "unknown",
      payload: {},
      autoReply: UNKNOWN_REPLY,
      createsRequest: false,
    };
  }

  if (isHelpCommand(normalized)) {
    return helpResult();
  }

  const reminderPreference = tryParseReminderPreference(normalized);
  if (reminderPreference) return reminderPreference;

  const pauseResume = tryParsePauseResume(normalized, today);
  if (pauseResume) return pauseResume;

  const skip = tryParseSkip(normalized, today, refYear);
  if (skip) return skip;

  const vacation = tryParseVacation(normalized, today, refYear);
  if (vacation) return vacation;

  return {
    commandType: "unknown",
    payload: {},
    autoReply: UNKNOWN_REPLY,
    createsRequest: false,
  };
}
