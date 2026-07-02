import { createServiceClient } from "@/lib/supabase/service";
import { getDateInTimezone, getDayOfWeek, routeRunsOnDay } from "@/lib/dates";
import { perfAsync } from "@/lib/perf";
import { resyncHikeStopSortOrders, appendNewDogsToDailyPlan } from "@/features/hikes/stop-order";
import type { StopType } from "@/types";

type ExceptionRow = {
  dog_id: string;
  start_date: string;
  end_date: string | null;
};

function isBlockedByException(
  dogId: string,
  date: string,
  exceptions: ExceptionRow[]
): boolean {
  return exceptions.some((ex) => {
    if (ex.dog_id !== dogId) return false;
    const end = ex.end_date ?? "9999-12-31";
    return date >= ex.start_date && date <= end;
  });
}

type DogSchedule = {
  id: string;
  schedule_type: "recurring" | "as_needed";
  pickup_window_start: string;
  pickup_window_end: string;
  dropoff_window_start: string | null;
  dropoff_window_end: string | null;
  route_sort_order: number;
  dog_schedule_days: { day_of_week: number }[];
};

function stopWindowsForDog(
  dog: DogSchedule,
  stopType: StopType
): { window_start: string | null; window_end: string | null } {
  if (stopType === "pickup") {
    return {
      window_start: dog.pickup_window_start,
      window_end: dog.pickup_window_end,
    };
  }

  if (dog.dropoff_window_start && dog.dropoff_window_end) {
    return {
      window_start: dog.dropoff_window_start,
      window_end: dog.dropoff_window_end,
    };
  }

  return { window_start: null, window_end: null };
}

async function ensureHikeRow(
  companyId: string,
  routeId: string,
  date: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("hikes")
    .select("id, driver_id")
    .eq("company_id", companyId)
    .eq("route_id", routeId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    if (!existing.driver_id) {
      await applyRouteDefaultDriver(supabase, existing.id, routeId);
    }
    return existing.id;
  }

  const { data: route } = await supabase
    .from("routes")
    .select("default_driver_id")
    .eq("id", routeId)
    .single();

  const { data: created, error } = await supabase
    .from("hikes")
    .insert({
      company_id: companyId,
      route_id: routeId,
      date,
      driver_id: route?.default_driver_id ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create hike");
  }

  return created.id;
}

async function applyRouteDefaultDriver(
  supabase: ReturnType<typeof createServiceClient>,
  hikeId: string,
  routeId: string
) {
  const { data: route } = await supabase
    .from("routes")
    .select("default_driver_id")
    .eq("id", routeId)
    .single();

  if (!route?.default_driver_id) return;

  await supabase
    .from("hikes")
    .update({ driver_id: route.default_driver_id })
    .eq("id", hikeId)
    .is("driver_id", null);
}

/** Sync stops for every route on a given date. */
export async function syncStopsForDate(companyId: string, date: string) {
  return perfAsync(`query sync-stops ${date}`, async () => {
    const supabase = createServiceClient();
    const { data: routes } = await supabase
      .from("routes")
      .select("id")
      .eq("company_id", companyId)
      .order("sort_order");

    const ids: (string | null)[] = [];
    for (const route of routes ?? []) {
      ids.push(await syncStopsForRouteDate(companyId, route.id, date));
    }
    return ids.filter((id): id is string => id != null);
  });
}

/** Sync today and tomorrow for a company (after dog/route/import changes). */
export async function syncStopsForTodayAndTomorrow(companyId: string) {
  const { getCompanyTimezone } = await import("@/features/company/queries");
  const { getDateInTimezone } = await import("@/lib/dates");
  const timeZone = await getCompanyTimezone(companyId);
  const today = getDateInTimezone(timeZone, 0);
  const tomorrow = getDateInTimezone(timeZone, 1);
  await Promise.all([
    syncStopsForDate(companyId, today),
    syncStopsForDate(companyId, tomorrow),
  ]);
}

/** Add/cancel stops for one route on one date.
 *
 * Daily route model:
 * - Recurring dogs on a route are the default pool when a route runs.
 * - As-needed dogs appear only via dog_day_assignments for that date.
 * - Stops (order + pickup windows) are the daily route plan / manifest.
 * - Sync adds missing stops but preserves an existing daily plan's order and ETAs.
 */
export async function syncStopsForRouteDate(
  companyId: string,
  routeId: string,
  date: string
): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const dayOfWeek = getDayOfWeek(date, timeZone);

  const { data: routeDays } = await supabase
    .from("route_schedule_days")
    .select("day_of_week")
    .eq("route_id", routeId);

  const scheduleDays = (routeDays ?? []).map((d) => d.day_of_week);
  const runsToday = routeRunsOnDay(scheduleDays, dayOfWeek);

  if (!runsToday) {
    const { data: existingHike } = await supabase
      .from("hikes")
      .select("id")
      .eq("company_id", companyId)
      .eq("route_id", routeId)
      .eq("date", date)
      .maybeSingle();

    if (existingHike) {
      await supabase
        .from("stops")
        .update({ status: "cancelled" })
        .eq("hike_id", existingHike.id)
        .eq("status", "scheduled");
    }

    return existingHike?.id ?? null;
  }

  const hikeId = await ensureHikeRow(companyId, routeId, date);

  const { data: recurringDogs } = await supabase
    .from("dogs")
    .select(
      `
      id,
      schedule_type,
      pickup_window_start,
      pickup_window_end,
      dropoff_window_start,
      dropoff_window_end,
      route_sort_order,
      dog_schedule_days ( day_of_week )
    `
    )
    .eq("company_id", companyId)
    .eq("route_id", routeId)
    .eq("is_active", true)
    .eq("schedule_type", "recurring");

  const { data: assignmentRows } = await supabase
    .from("dog_day_assignments")
    .select("dog_id")
    .eq("company_id", companyId)
    .eq("route_id", routeId)
    .eq("date", date);

  const assignedDogIds = (assignmentRows ?? []).map((row) => row.dog_id);

  const { data: asNeededDogs } =
    assignedDogIds.length > 0
      ? await supabase
          .from("dogs")
          .select(
            `
            id,
            schedule_type,
      pickup_window_start,
      pickup_window_end,
      dropoff_window_start,
      dropoff_window_end,
      route_sort_order,
      dog_schedule_days ( day_of_week )
          `
          )
          .eq("company_id", companyId)
          .eq("is_active", true)
          .eq("schedule_type", "as_needed")
          .in("id", assignedDogIds)
      : { data: [] };

  const scheduledDogs = [
    ...((recurringDogs ?? []) as DogSchedule[]),
    ...((asNeededDogs ?? []) as DogSchedule[]),
  ];
  // Recurring dogs on a route run when the route runs. As-needed dogs run only
  // when manually assigned for a specific date (dog_day_assignments).

  const dogIds = scheduledDogs.map((d) => d.id);

  const { data: exceptions } =
    dogIds.length > 0
      ? await supabase
          .from("schedule_exceptions")
          .select("dog_id, start_date, end_date")
          .in("dog_id", dogIds)
      : { data: [] };

  const eligibleIds = new Set(
    scheduledDogs
      .filter((d) => !isBlockedByException(d.id, date, exceptions ?? []))
      .map((d) => d.id)
  );

  const { data: existingStops } = await supabase
    .from("stops")
    .select("id, dog_id, stop_type, status")
    .eq("hike_id", hikeId);

  const existingDogIdsBefore = new Set(
    (existingStops ?? []).map((stop) => stop.dog_id)
  );

  const { data: existingPickupStops } = await supabase
    .from("stops")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup");

  const hadDailyPlan = (existingPickupStops ?? []).some(
    (stop) => stop.status !== "cancelled" && stop.status !== "skipped"
  );

  for (const stop of existingStops ?? []) {
    if (!eligibleIds.has(stop.dog_id)) {
      await supabase.from("stops").delete().eq("id", stop.id);
    }
  }

  const eligibleDogs = scheduledDogs.filter((d) => eligibleIds.has(d.id));
  const sortedEligible = [...eligibleDogs].sort((a, b) => {
    const aRecurring = a.schedule_type === "recurring" ? 0 : 1;
    const bRecurring = b.schedule_type === "recurring" ? 0 : 1;
    if (aRecurring !== bRecurring) return aRecurring - bRecurring;
    return a.route_sort_order - b.route_sort_order;
  });
  const pickupIndexByDogId = new Map(
    sortedEligible.map((dog, index) => [dog.id, index])
  );

  for (const dog of eligibleDogs) {
    const pickupIndex = pickupIndexByDogId.get(dog.id) ?? 0;

    for (const stopType of ["pickup", "dropoff"] as StopType[]) {
      // Temporary slots — final order applied in bulk after the loop (avoids unique constraint conflicts).
      const sortOrder =
        stopType === "pickup" ? 1000 + pickupIndex : 2000 + pickupIndex;

      const { data: existing } = await supabase
        .from("stops")
        .select("id, status")
        .eq("hike_id", hikeId)
        .eq("dog_id", dog.id)
        .eq("stop_type", stopType)
        .maybeSingle();

      if (existing) {
        if (existing.status === "cancelled") {
          await supabase
            .from("stops")
            .update({ status: "scheduled", sort_order: sortOrder })
            .eq("id", existing.id);
        }
        continue;
      }

      const windows = stopWindowsForDog(dog, stopType);

      const { error } = await supabase.from("stops").insert({
        hike_id: hikeId,
        dog_id: dog.id,
        stop_type: stopType,
        window_start: windows.window_start,
        window_end: windows.window_end,
        sort_order: sortOrder,
      });
      if (error) throw new Error(error.message);
    }
  }

  const newDogs = sortedEligible.filter((dog) => !existingDogIdsBefore.has(dog.id));

  if (hadDailyPlan) {
    const appendError = await appendNewDogsToDailyPlan(
      supabase,
      hikeId,
      newDogs.map((dog) => dog.id),
      newDogs
    );
    if (appendError) throw new Error(appendError);
  } else {
    const sortError = await resyncHikeStopSortOrders(
      supabase,
      hikeId,
      sortedEligible
    );
    if (sortError) throw new Error(sortError);
  }

  return hikeId;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDaysToDate(cursor, 1);
  }
  return dates;
}

/** Dates to re-sync after a pending request is approved. */
export function datesToSyncAfterApproval(
  commandType: string,
  payload: {
    target_date?: string;
    start_date?: string;
    end_date?: string | null;
  },
  timeZone: string
): string[] {
  const dates = new Set<string>([
    getDateInTimezone(timeZone, 0),
    getDateInTimezone(timeZone, 1),
  ]);

  if (payload.target_date) dates.add(payload.target_date);

  if (payload.start_date) {
    if (payload.end_date) {
      for (const d of dateRangeInclusive(payload.start_date, payload.end_date)) {
        dates.add(d);
      }
    } else if (commandType === "pause") {
      for (let i = 0; i < 14; i++) {
        dates.add(addDaysToDate(payload.start_date, i));
      }
    } else if (commandType === "resume") {
      for (let i = 0; i < 14; i++) {
        dates.add(addDaysToDate(payload.start_date, i));
      }
    }
  }

  return [...dates].sort();
}
