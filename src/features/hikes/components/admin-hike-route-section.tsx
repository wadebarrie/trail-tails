import { DriverSelect } from "@/features/hikes/components/driver-select";
import {
  CompleteHikeButton,
  HikeStatusBadge,
} from "@/features/hikes/components/complete-hike-button";
import { HikeStopsSection } from "@/features/hikes/components/hike-stops-section";
import type { HikeWithRoute } from "@/features/hikes/queries";

type Driver = { id: string; full_name: string };

export function AdminHikeRouteSection({
  entry,
  drivers,
  dateLabel,
}: {
  entry: HikeWithRoute;
  drivers: Driver[];
  dateLabel?: string;
}) {
  const { route, hike } = entry;
  if (!hike) return null;

  const stops = hike.stops as Parameters<typeof HikeStopsSection>[0]["stops"];

  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-stone-900">{route.name}</h2>
          {dateLabel ? (
            <span className="text-sm text-stone-500">{dateLabel}</span>
          ) : null}
          <HikeStatusBadge status={hike.status} />
        </div>
        <CompleteHikeButton hikeId={hike.id} status={hike.status} />
      </div>

      <div className="mt-4 mb-6">
        <DriverSelect
          hikeId={hike.id}
          currentDriverId={hike.driver_id}
          drivers={drivers}
        />
      </div>

      <div className="space-y-10">
        <HikeStopsSection
          hikeId={hike.id}
          stopType="pickup"
          title="Morning pickups"
          stops={stops}
        />
        <HikeStopsSection
          hikeId={hike.id}
          stopType="dropoff"
          title="Afternoon drop-offs"
          stops={stops}
        />
      </div>
    </section>
  );
}
