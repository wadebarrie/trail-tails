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
