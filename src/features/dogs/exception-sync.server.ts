import "server-only";

import { after } from "next/server";
import { syncStopsForRouteDate, addDaysToDate } from "@/features/hikes/sync-stops";
import { getDateInTimezone } from "@/lib/dates";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExceptionType } from "@/types";

/** Rolling window used only when listing candidate dates for open-ended pauses. */
const PAUSE_CANDIDATE_DAYS = 14;

export type ExceptionStopSyncOptions = {
  /**
   * For open-ended pauses/resumes: also sync every already-materialized hike
   * date ≥ today on the affected routes (not just a rolling window).
   */
  includeAllFutureRouteHikes?: boolean;
};

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
    return Array.from({ length: PAUSE_CANDIDATE_DAYS }, (_, i) =>
      addDaysToDate(startDate, i)
    );
  }
  return [startDate];
}

function dateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysToDate(cursor, 1);
  }
  return dates;
}

/**
 * Drop past dates only — sync the full remaining exception window (vacations
 * included). Always keeps today + tomorrow so near-term day plans stay fresh.
 */
export function datesToSyncFromToday(
  dates: string[],
  timeZone: string
): string[] {
  const today = getDateInTimezone(timeZone, 0);
  const tomorrow = getDateInTimezone(timeZone, 1);
  const result = new Set<string>([today, tomorrow]);

  for (const date of dates) {
    if (date >= today) {
      result.add(date);
    }
  }

  return [...result].sort();
}

/** @deprecated Use datesToSyncFromToday — kept for any external imports. */
export function datesToSyncNearTerm(
  dates: string[],
  timeZone: string
): string[] {
  return datesToSyncFromToday(dates, timeZone);
}

/** Sync only routes for the affected dogs — not every company route. */
export async function syncStopsAfterExceptionChange(
  companyId: string,
  dogIds: string[],
  dates: string[],
  options?: ExceptionStopSyncOptions
): Promise<void> {
  const uniqueDogIds = [...new Set(dogIds)];
  if (!uniqueDogIds.length) return;

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(timeZone, 0);
  const datesToSync = new Set(datesToSyncFromToday(dates, timeZone));

  const { data: dogs } = await supabase
    .from("dogs")
    .select("route_id")
    .in("id", uniqueDogIds);

  const routeIds = [
    ...new Set(
      (dogs ?? [])
        .map((d) => d.route_id)
        .filter((id): id is string => id != null)
    ),
  ];

  if (!routeIds.length) return;

  if (options?.includeAllFutureRouteHikes) {
    const { data: futureHikes } = await supabase
      .from("hikes")
      .select("date")
      .eq("company_id", companyId)
      .in("route_id", routeIds)
      .gte("date", today);

    for (const hike of futureHikes ?? []) {
      datesToSync.add(hike.date);
    }
  }

  const sortedDates = [...datesToSync].sort();
  if (!sortedDates.length) return;

  for (const date of sortedDates) {
    await Promise.all(
      routeIds.map((routeId) => syncStopsForRouteDate(companyId, routeId, date))
    );
  }
}

/** Run stop sync after the server action response — avoids Netlify 502 timeouts. */
export function scheduleExceptionStopSync(
  companyId: string,
  dogIds: string[],
  dates: string[],
  options?: ExceptionStopSyncOptions
): void {
  after(async () => {
    try {
      await syncStopsAfterExceptionChange(companyId, dogIds, dates, options);
    } catch (err) {
      console.error("[exception-sync] stop sync failed:", err);
    }
  });
}
