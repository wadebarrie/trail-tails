import { getCurrentProfile } from "@/features/auth/queries";
import { canAccessAdmin, canAccessDriver } from "@/features/auth/access";
import { getCompanyTimezone } from "@/features/company/queries";
import { createClient } from "@/lib/supabase/server";
import { logErrorFromException, logWarn } from "@/lib/logger";
import { PerfTimer } from "@/lib/perf";
import { syncStopsForDate } from "@/features/hikes/sync-stops";
import { periodsForRoute, type HikePeriod } from "@/features/hikes/hike-period";
import {
  getRouteScheduleDays,
  listRoutes,
  type RouteWithSchedule,
} from "@/features/routes/queries";
import { getDayOfWeek, routeRunsOnDay } from "@/lib/dates";

const HIKE_SELECT = `
  id,
  date,
  period,
  status,
  driver_id,
  route_id,
  stops (
    id,
    dog_id,
    stop_type,
    status,
    window_start,
    window_end,
    sort_order,
    driver_lat,
    driver_lng,
    dogs (
      name,
      breed,
      notes,
      schedule_type,
      customers ( owner_name, phone, secondary_owner_name, secondary_phone, email, address, address_lat, address_lng, notes )
    )
  )
`;

export type HikeWithRoute = {
  route: RouteWithSchedule;
  period: HikePeriod;
  hike: {
    id: string;
    date: string;
    period: HikePeriod;
    status: string;
    driver_id: string | null;
    route_id: string;
    stops: unknown[];
  } | null;
};

export type GetHikesWithStopsOptions = {
  /** Run stop sync before read. Off by default — use mutations or Refresh routes. */
  sync?: boolean;
  /** Skip timezone lookup when the caller already resolved it. */
  timeZone?: string;
};

/** Ensure hikes exist for all routes on a date and sync stops. */
export async function ensureHikeForDate(companyId: string, date: string) {
  const profile = await getCurrentProfile();
  if (
    !profile?.is_active ||
    profile.company_id !== companyId ||
    (!canAccessAdmin(profile) && !canAccessDriver(profile))
  ) {
    throw new Error("Unauthorized");
  }

  return syncStopsForDate(companyId, date);
}

export async function getHikesWithStopsForDate(
  companyId: string,
  date: string,
  options: GetHikesWithStopsOptions = {}
): Promise<HikeWithRoute[]> {
  const { sync = false, timeZone: timeZoneOverride } = options;
  const timer = new PerfTimer(`query hikes-for-date ${date}`);

  if (sync) {
    try {
      await ensureHikeForDate(companyId, date);
    } catch (error) {
      logErrorFromException("hike", "Failed to ensure hikes for date", error, {
        companyId,
        context: { date },
      });
    }
    timer.mark("sync");
  }

  const supabase = await createClient();
  const timeZone = timeZoneOverride ?? (await getCompanyTimezone(companyId));
  const dayOfWeek = getDayOfWeek(date, timeZone);
  const routes = await listRoutes(companyId);
  timer.mark("routes");

  const { data: hikes, error } = await supabase
    .from("hikes")
    .select(HIKE_SELECT)
    .eq("company_id", companyId)
    .eq("date", date);

  if (error) {
    logWarn("hike", "Failed to load hikes with stops", {
      companyId,
      context: { date, dbError: error.message },
    });
    timer.end("error");
    return routes
      .filter((route) =>
        routeRunsOnDay(getRouteScheduleDays(route), dayOfWeek)
      )
      .flatMap((route) =>
        periodsForRoute(route.runs_afternoon).map((period) => ({
          route,
          period,
          hike: null,
        }))
      );
  }

  const hikeByRoutePeriod = new Map(
    (hikes ?? []).map((hike) => [
      `${hike.route_id as string}:${hike.period as HikePeriod}`,
      hike,
    ])
  );

  const results: HikeWithRoute[] = [];
  for (const route of routes) {
    const scheduleDays = getRouteScheduleDays(route);
    if (!routeRunsOnDay(scheduleDays, dayOfWeek)) {
      continue;
    }

    for (const period of periodsForRoute(route.runs_afternoon)) {
      const hike = hikeByRoutePeriod.get(`${route.id}:${period}`);
      results.push({
        route,
        period,
        hike: (hike as HikeWithRoute["hike"]) ?? null,
      });
    }
  }

  timer.end(`${results.length} hikes`);
  return results;
}

/** @deprecated Use getHikesWithStopsForDate — returns first route's hike for compatibility */
export async function getHikeWithStops(companyId: string, date: string) {
  const all = await getHikesWithStopsForDate(companyId, date);
  return all.find((h) => h.hike)?.hike ?? null;
}
