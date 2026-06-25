import { getCurrentProfile } from "@/features/auth/queries";
import { canAccessAdmin, canAccessDriver } from "@/features/auth/access";
import { createClient } from "@/lib/supabase/server";
import { logErrorFromException, logWarn } from "@/lib/logger";
import { syncStopsForDate } from "@/features/hikes/sync-stops";
import {
  getRouteScheduleDays,
  listRoutes,
  type RouteWithSchedule,
} from "@/features/routes/queries";
import { getDayOfWeek, routeRunsOnDay } from "@/lib/dates";

const HIKE_SELECT = `
  id,
  date,
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
    dogs (
      name,
      breed,
      notes,
      customers ( owner_name, phone, email, address, address_lat, address_lng, notes )
    )
  )
`;

export type HikeWithRoute = {
  route: RouteWithSchedule;
  hike: {
    id: string;
    date: string;
    status: string;
    driver_id: string | null;
    route_id: string;
    stops: unknown[];
  } | null;
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
  date: string
): Promise<HikeWithRoute[]> {
  try {
    await ensureHikeForDate(companyId, date);
  } catch (error) {
    logErrorFromException("hike", "Failed to ensure hikes for date", error, {
      companyId,
      context: { date },
    });
    return [];
  }

  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const dayOfWeek = getDayOfWeek(date, timeZone);
  const routes = await listRoutes(companyId);

  const results: HikeWithRoute[] = [];

  for (const route of routes) {
    const scheduleDays = getRouteScheduleDays(route);
    if (!routeRunsOnDay(scheduleDays, dayOfWeek)) {
      continue;
    }

    const { data: hike, error } = await supabase
      .from("hikes")
      .select(HIKE_SELECT)
      .eq("company_id", companyId)
      .eq("route_id", route.id)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      logWarn("hike", "Failed to load hike with stops", {
        companyId,
        context: { date, routeId: route.id, dbError: error.message },
      });
      results.push({ route, hike: null });
      continue;
    }

    results.push({ route, hike: hike ?? null });
  }

  return results;
}

/** @deprecated Use getHikesWithStopsForDate — returns first route's hike for compatibility */
export async function getHikeWithStops(companyId: string, date: string) {
  const all = await getHikesWithStopsForDate(companyId, date);
  return all.find((h) => h.hike)?.hike ?? null;
}
