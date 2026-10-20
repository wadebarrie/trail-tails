import { timeToMinutes } from "@/lib/dates";

export type VehicleLoadRoute = {
  routeId: string;
  routeName: string;
  period: "morning" | "afternoon";
  vehicleId: string | null;
  vehicleLabel: string;
  capacity: number | null;
  dogCount: number;
  earliestStart: string | null;
  latestEnd: string | null;
};

function rangesOverlap(a: VehicleLoadRoute, b: VehicleLoadRoute): boolean {
  if (
    !a.earliestStart ||
    !a.latestEnd ||
    !b.earliestStart ||
    !b.latestEnd
  ) {
    return a.period === b.period;
  }
  const a0 = timeToMinutes(a.earliestStart);
  const a1 = timeToMinutes(a.latestEnd);
  const b0 = timeToMinutes(b.earliestStart);
  const b1 = timeToMinutes(b.latestEnd);
  return a0 < b1 && b0 < a1;
}

/** Warnings when one vehicle is over capacity or covering overlapping routes. */
export function vehicleLoadWarningMessages(routes: VehicleLoadRoute[]): string[] {
  const byVehicle = new Map<string, VehicleLoadRoute[]>();
  for (const route of routes) {
    if (!route.vehicleId || route.dogCount <= 0) continue;
    const list = byVehicle.get(route.vehicleId) ?? [];
    list.push(route);
    byVehicle.set(route.vehicleId, list);
  }

  const messages: string[] = [];
  for (const group of byVehicle.values()) {
    const label = group[0]?.vehicleLabel ?? "Vehicle";
    for (const period of ["morning", "afternoon"] as const) {
      const inPeriod = group.filter((route) => route.period === period);
      const dogs = inPeriod.reduce((sum, route) => sum + route.dogCount, 0);
      const capacity = inPeriod.find((route) => route.capacity != null)?.capacity;
      if (capacity != null && dogs > capacity) {
        messages.push(
          `${label} is over capacity for ${period}: ${dogs} / ${capacity} dogs.`
        );
      }
    }

    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const left = group[i];
        const right = group[j];
        if (!left || !right || !rangesOverlap(left, right)) continue;
        messages.push(
          `${left.routeName} and ${right.routeName} both use ${label} at overlapping pickup times.`
        );
      }
    }
  }

  return messages;
}

type HikeStopWindow = {
  stop_type?: string;
  window_start?: string | null;
  window_end?: string | null;
};

export function hikeVehicleLoadWarnings(
  entries: {
    route: {
      id: string;
      name: string;
      period: "morning" | "afternoon";
      default_vehicle_id: string | null;
    };
    hike: { vehicle_id: string | null; stops: unknown[] } | null;
  }[],
  vehicles: {
    id: string;
    name: string;
    plate: string | null;
    capacity: number | null;
  }[]
): string[] {
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  return vehicleLoadWarningMessages(
    entries.map((entry) => {
      const stops = (entry.hike?.stops ?? []) as HikeStopWindow[];
      const pickups = stops.filter((stop) => stop.stop_type === "pickup");
      const starts = pickups
        .map((stop) => stop.window_start)
        .filter((value): value is string => Boolean(value))
        .sort();
      const ends = pickups
        .map((stop) => stop.window_end)
        .filter((value): value is string => Boolean(value))
        .sort();
      const vehicleId = entry.hike?.vehicle_id ?? entry.route.default_vehicle_id;
      const vehicle = vehicleId ? vehicleById.get(vehicleId) : undefined;
      return {
        routeId: entry.route.id,
        routeName: entry.route.name,
        period: entry.route.period,
        vehicleId,
        vehicleLabel: vehicle
          ? `${vehicle.name}${vehicle.plate ? ` · ${vehicle.plate}` : ""}`
          : "Vehicle",
        capacity: vehicle?.capacity ?? null,
        dogCount: pickups.length,
        earliestStart: starts[0] ?? null,
        latestEnd: ends.at(-1) ?? null,
      };
    })
  );
}
