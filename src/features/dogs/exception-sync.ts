import {
  addDaysToDate,
  dateRangeInclusive,
  syncStopsForDate,
} from "@/features/hikes/sync-stops";
import type { ExceptionType } from "@/types";

export function resolveExceptionEndDate(
  exceptionType: ExceptionType,
  startDate: string,
  endDate: string | null
): string | null {
  if (exceptionType === "pause") return null;
  return endDate ?? (exceptionType === "vacation" ? null : startDate);
}

export function datesAffectedByException(
  exceptionType: ExceptionType,
  startDate: string,
  endDate: string | null
): string[] {
  const end = resolveExceptionEndDate(exceptionType, startDate, endDate);

  if (end && end !== startDate) {
    return dateRangeInclusive(startDate, end);
  }
  if (exceptionType === "pause") {
    return Array.from({ length: 14 }, (_, i) => addDaysToDate(startDate, i));
  }
  return [startDate];
}

export async function syncStopsForExceptionDates(
  companyId: string,
  dates: string[]
): Promise<void> {
  for (const date of [...new Set(dates)].sort()) {
    await syncStopsForDate(companyId, date);
  }
}

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
