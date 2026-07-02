import type { Profile } from "@/types";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { one } from "@/lib/supabase/relations";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";
import { perfAsync } from "@/lib/perf";
import type { StopStatus, StopType } from "@/types";

export type DriverStopView = {
  id: string;
  stopType: StopType;
  status: StopStatus;
  windowStart: string;
  windowEnd: string;
  sortOrder: number;
  dogName: string;
  dogBreed: string | null;
  dogNotes: string | null;
  ownerName: string;
  phone: string;
  secondaryOwnerName: string | null;
  secondaryPhone: string | null;
  email: string | null;
  address: string;
  customerNotes: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  originLat: number | null;
  originLng: number | null;
};

export type DriverRouteView = {
  routeId: string;
  routeName: string;
  hikeId: string;
  pickups: DriverStopView[];
  dropoffs: DriverStopView[];
};

export type DriverDayView = {
  date: string;
  dateLabel: string;
  routes: DriverRouteView[];
};

function mapStop(raw: Record<string, unknown>): DriverStopView {
  const dog = one(
    raw.dogs as
      | {
          name: string;
          breed: string | null;
          notes: string | null;
          customers: unknown;
        }
      | {
          name: string;
          breed: string | null;
          notes: string | null;
          customers: unknown;
        }[]
  );
  const customer = one(
    dog?.customers as
      | {
          owner_name: string;
          phone: string;
          secondary_owner_name: string | null;
          secondary_phone: string | null;
          email: string | null;
          address: string;
          address_lat: number | null;
          address_lng: number | null;
          notes: string | null;
        }
      | {
          owner_name: string;
          phone: string;
          secondary_owner_name: string | null;
          secondary_phone: string | null;
          email: string | null;
          address: string;
          address_lat: number | null;
          address_lng: number | null;
          notes: string | null;
        }[]
      | undefined
  );

  return {
    id: raw.id as string,
    stopType: raw.stop_type as StopType,
    status: raw.status as StopStatus,
    windowStart: raw.window_start as string,
    windowEnd: raw.window_end as string,
    sortOrder: raw.sort_order as number,
    dogName: dog?.name ?? "Unknown",
    dogBreed: dog?.breed ?? null,
    dogNotes: dog?.notes ?? null,
    ownerName: customer?.owner_name ?? "",
    phone: customer?.phone ?? "",
    secondaryOwnerName: customer?.secondary_owner_name ?? null,
    secondaryPhone: customer?.secondary_phone ?? null,
    email: customer?.email ?? null,
    address: customer?.address ?? "",
    customerNotes: customer?.notes ?? null,
    destinationLat: customer?.address_lat ?? null,
    destinationLng: customer?.address_lng ?? null,
    originLat: (raw.driver_lat as number | null) ?? null,
    originLng: (raw.driver_lng as number | null) ?? null,
  };
}

function sortStops(stops: DriverStopView[]) {
  return [...stops].sort((a, b) => {
    const aDone = isStopDone(a);
    const bDone = isStopDone(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
}

function isStopDone(stop: DriverStopView) {
  return stop.status === "picked_up" || stop.status === "dropped_off";
}

function isActiveStop(status: StopStatus) {
  return status !== "cancelled" && status !== "skipped";
}

type DriverProfile = Pick<Profile, "id" | "role" | "can_drive">;

function driverSeesRoute(
  entry: Awaited<ReturnType<typeof getHikesWithStopsForDate>>[number],
  profile: DriverProfile
): boolean {
  if (profile.role === "admin" && profile.can_drive) return true;
  if (!entry.hike) return false;
  if (entry.hike.driver_id === profile.id) return true;
  return entry.route.default_driver_id === profile.id;
}

export async function getDriverDayView(
  companyId: string,
  timeZone: string,
  profile: DriverProfile,
  offsetDays = 0
): Promise<DriverDayView> {
  return perfAsync(`query driver-day-view offset=${offsetDays}`, async () => {
    const date = getDateInTimezone(timeZone, offsetDays);
    const hikes = await getHikesWithStopsForDate(companyId, date);

    const routes: DriverRouteView[] = hikes
      .filter((entry) => driverSeesRoute(entry, profile))
      .filter((entry) => entry.hike)
      .map((entry) => {
        const rawStops = (entry.hike?.stops ?? []) as Record<string, unknown>[];
        const mapped = rawStops.map(mapStop).filter((s) => isActiveStop(s.status));
        return {
          routeId: entry.route.id,
          routeName: entry.route.name,
          hikeId: entry.hike!.id,
          pickups: sortStops(mapped.filter((s) => s.stopType === "pickup")),
          dropoffs: sortStops(mapped.filter((s) => s.stopType === "dropoff")),
        };
      })
      .filter((r) => r.pickups.length > 0 || r.dropoffs.length > 0);

    return {
      date,
      dateLabel: formatDateLabel(date, timeZone),
      routes,
    };
  });
}

/** @deprecated Use getDriverDayView */
export async function getDriverTodayView(
  companyId: string,
  timeZone: string,
  profile: DriverProfile
): Promise<DriverDayView> {
  return getDriverDayView(companyId, timeZone, profile, 0);
}

export async function getDriverCompanyTimezone(companyId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  return data?.timezone ?? "America/Los_Angeles";
}
