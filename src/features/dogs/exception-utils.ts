/** Client-safe helpers for schedule exception display. */

export function formatExceptionDates(
  startDate: string,
  endDate: string | null,
  exceptionType: string
): string {
  if (endDate && endDate !== startDate) {
    return `${startDate} → ${endDate}`;
  }
  if (!endDate && exceptionType === "pause") {
    return `${startDate} (open-ended pause)`;
  }
  if (!endDate) {
    return `${startDate} (open-ended)`;
  }
  return startDate;
}
