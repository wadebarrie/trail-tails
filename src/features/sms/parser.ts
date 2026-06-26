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
      createsRequest: false;
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

export const HELP_REPLY = `PackRoute — text us:
SKIP TOMORROW
SKIP MONDAY (or any weekday)
SKIP 7/10 or SKIP JULY 10
VACATION JULY 10-18
PAUSE
RESUME or BACK ON
HELP

Schedule changes are reviewed by the office before they take effect.`;

export const UNKNOWN_REPLY = `We didn't recognize that command. Reply HELP for options.`;

export const REQUEST_ACK_REPLY =
  "Got it! We'll review your request shortly.";

export const UNREGISTERED_PHONE_REPLY =
  "We don't recognize this number. Please contact the office for help.";

function normalizeBody(body: string): string {
  return body.trim().replace(/\s+/g, " ").toUpperCase();
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
  const range = text.match(
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

  const single = text.match(/^([A-Z]+)\s+(\d{1,2})$/i);
  if (single) {
    const m = MONTH_NAMES[single[1].toLowerCase()];
    const d = Number(single[2]);
    if (!m) return null;
    const start = parseIsoDate(referenceYear, m, d);
    if (!start) return null;
    return { start, end: start };
  }

  const numeric = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
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

  if (normalized === "HELP" || normalized === "?") {
    return {
      commandType: "help",
      payload: {},
      autoReply: HELP_REPLY,
      createsRequest: false,
    };
  }

  if (normalized === "SKIP TOMORROW") {
    return {
      commandType: "skip_tomorrow",
      payload: { target_date: addDays(today, 1) },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  if (normalized === "PAUSE") {
    return {
      commandType: "pause",
      payload: { start_date: today, end_date: null },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  if (normalized === "RESUME" || normalized === "BACK ON") {
    return {
      commandType: "resume",
      payload: { start_date: today },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  const skipWeekday = normalized.match(/^SKIP\s+(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|MON|TUE|TUES|WED|THU|THUR|THURS|FRI|SAT|SUN)$/);
  if (skipWeekday) {
    const dow = WEEKDAY_NAMES[skipWeekday[1].toLowerCase()];
    if (dow == null) {
      return {
        commandType: "unknown",
        payload: {},
        autoReply: UNKNOWN_REPLY,
        createsRequest: false,
      };
    }
    const target = nextDateForWeekday(today, dow);
    return {
      commandType: "skip_weekday",
      payload: { day_of_week: dow, target_date: target },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  if (normalized.startsWith("VACATION ")) {
    const rest = normalized.slice("VACATION ".length);
    const parsed = parseMonthDay(rest, refYear);
    if (!parsed) {
      return {
        commandType: "unknown",
        payload: {},
        autoReply: UNKNOWN_REPLY,
        createsRequest: false,
      };
    }
    return {
      commandType: "vacation",
      payload: {
        start_date: parsed.start,
        end_date: parsed.end,
      },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  if (normalized.startsWith("SKIP ")) {
    const rest = normalized.slice("SKIP ".length);
    const parsed = parseMonthDay(rest, refYear);
    if (!parsed?.start) {
      return {
        commandType: "unknown",
        payload: {},
        autoReply: UNKNOWN_REPLY,
        createsRequest: false,
      };
    }
    return {
      commandType: "skip_date",
      payload: { target_date: parsed.start },
      autoReply: REQUEST_ACK_REPLY,
      createsRequest: true,
    };
  }

  return {
    commandType: "unknown",
    payload: {},
    autoReply: UNKNOWN_REPLY,
    createsRequest: false,
  };
}
