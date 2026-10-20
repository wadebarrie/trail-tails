import { getLocalTimeInTimezone, isPastLocalTime } from "../../lib/dates";

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
