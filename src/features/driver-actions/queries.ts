import { createClient } from "@/lib/supabase/server";
import { getHikeWithStops } from "@/features/hikes/queries";
import { one } from "@/lib/supabase/relations";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";
import type { StopStatus, StopType } from "@/types";

export type DriverStopView = {
  id: string;
  stopType: StopType;
  status: StopStatus;
  windowStart: string;
  windowEnd: string;
  sortOrder: number;
  dogName: string;
  ownerName: string;
  destinationLat: number | null;
  destinationLng: number | null;
};

export type DriverDayView = {
  hikeId: string;
  date: string;
  dateLabel: string;
  pickups: DriverStopView[];
  dropoffs: DriverStopView[];
};

function mapStop(raw: Record<string, unknown>): DriverStopView {
  const dog = one(
    raw.dogs as
      | {
          name: string;
          customers:
            | { owner_name: string; address_lat: number | null; address_lng: number | null }
            | { owner_name: string; address_lat: number | null; address_lng: number | null }[];
        }
      | {
          name: string;
          customers:
            | { owner_name: string; address_lat: number | null; address_lng: number | null }
            | { owner_name: string; address_lat: number | null; address_lng: number | null }[];
        }[]
  );
  const customer = one(
    dog?.customers as
      | { owner_name: string; address_lat: number | null; address_lng: number | null }
      | { owner_name: string; address_lat: number | null; address_lng: number | null }[]
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
    ownerName: customer?.owner_name ?? "",
    destinationLat: customer?.address_lat ?? null,
    destinationLng: customer?.address_lng ?? null,
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

export async function getDriverTodayView(
  companyId: string,
  timeZone: string
): Promise<DriverDayView> {
  const date = getDateInTimezone(timeZone, 0);
  const hike = await getHikeWithStops(companyId, date);

  const rawStops = (hike?.stops ?? []) as Record<string, unknown>[];
  const mapped = rawStops.map(mapStop);

  return {
    hikeId: hike?.id ?? "",
    date,
    dateLabel: formatDateLabel(date, timeZone),
    pickups: sortStops(mapped.filter((s) => s.stopType === "pickup")),
    dropoffs: sortStops(mapped.filter((s) => s.stopType === "dropoff")),
  };
}

export async function getDriverCompanyTimezone(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  return data?.timezone ?? "America/Los_Angeles";
}
