const DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** YYYY-MM-DD in the given IANA timezone */
export function getDateInTimezone(timeZone: string, offsetDays = 0): string {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setUTCDate(date.getUTCDate() + offsetDays);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 0 = Sunday … 6 = Saturday, in company timezone */
export function getDayOfWeek(dateStr: string, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date(`${dateStr}T12:00:00`));
  return DOW[weekday] ?? 0;
}

export function formatDateLabel(dateStr: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateStr}T12:00:00`));
}

export function formatTime(time: string): string {
  const [hour, minute] = time.split(":");
  const h = Number(hour);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

export function formatWindowRange(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  if (!start || !end) return null;
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** Minutes since midnight for HH:MM or HH:MM:SS. */
export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

/** Current local hour/minute in an IANA timezone. */
export function getLocalTimeInTimezone(timeZone: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(at);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute, minutesSinceMidnight: hour * 60 + minute };
}

/** True when local time is at or past the configured HH:MM time. */
export function isPastLocalTime(timeZone: string, time: string, at = new Date()): boolean {
  return getLocalTimeInTimezone(timeZone, at).minutesSinceMidnight >= timeToMinutes(time);
}

export const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export function parseScheduleDays(raw?: string): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => d >= 0 && d <= 6);
}

const DAY_NAME_TO_NUM: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/** Accept numeric (0–6) or day names (Mon, Tuesday, etc.). */
export function parseScheduleDaysFlexible(raw?: string): number[] {
  if (!raw?.trim()) return [];

  const days = new Set<number>();
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;

    const asNum = Number(token);
    if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 6) {
      days.add(asNum);
      continue;
    }

    const named = DAY_NAME_TO_NUM[token.toLowerCase()];
    if (named !== undefined) {
      days.add(named);
    }
  }

  return [...days].sort((a, b) => a - b);
}

export function formatScheduleDaysForCsv(days: number[]): string {
  if (!days.length) return "";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
    .filter(Boolean)
    .join(",");
}

export function formatScheduleDayLabels(days: number[]): string {
  if (!days.length) return "No days set";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
    .filter(Boolean)
    .join(", ");
}

export function routeRunsOnDay(scheduleDays: number[], dayOfWeek: number): boolean {
  return scheduleDays.length > 0 && scheduleDays.includes(dayOfWeek);
}
