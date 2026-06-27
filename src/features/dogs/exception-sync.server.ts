import "server-only";

import { after } from "next/server";
import { syncStopsForRouteDate, addDaysToDate } from "@/features/hikes/sync-stops";
import { getDateInTimezone } from "@/lib/dates";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExceptionType } from "@/types";

const SYNC_HORIZON_DAYS = 14;

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

function dateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysToDate(cursor, 1);
  }
  return dates;
}

/** Limit sync to today, tomorrow, and near-term affected dates. */
export function datesToSyncNearTerm(
  dates: string[],
  timeZone: string
): string[] {
  const today = getDateInTimezone(timeZone, 0);
  const tomorrow = getDateInTimezone(timeZone, 1);
  const horizonEnd = addDaysToDate(today, SYNC_HORIZON_DAYS - 1);
  const result = new Set<string>([today, tomorrow]);

  for (const date of dates) {
    if (date >= today && date <= horizonEnd) {
      result.add(date);
    }
  }

  return [...result].sort();
}

/** Sync only routes for the affected dogs — not every company route. */
export async function syncStopsAfterExceptionChange(
  companyId: string,
  dogIds: string[],
  dates: string[]
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
  const datesToSync = datesToSyncNearTerm(dates, timeZone);
  if (!datesToSync.length) return;

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

  for (const date of datesToSync) {
    await Promise.all(
      routeIds.map((routeId) => syncStopsForRouteDate(companyId, routeId, date))
    );
  }
}

/** Run stop sync after the server action response — avoids Netlify 502 timeouts. */
export function scheduleExceptionStopSync(
  companyId: string,
  dogIds: string[],
  dates: string[]
): void {
  after(async () => {
    try {
      await syncStopsAfterExceptionChange(companyId, dogIds, dates);
    } catch (err) {
      console.error("[exception-sync] stop sync failed:", err);
    }
  });
}
