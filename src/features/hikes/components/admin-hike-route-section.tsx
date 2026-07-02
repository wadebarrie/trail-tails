import { DriverSelect } from "@/features/hikes/components/driver-select";
import {
  HikeAddAsNeededDogSelect,
  type AddableAsNeededDog,
} from "@/features/hikes/components/hike-add-as-needed-dog-select";
import {
  CompleteHikeButton,
  HikeStatusBadge,
} from "@/features/hikes/components/complete-hike-button";
import { HikeStopsSection } from "@/features/hikes/components/hike-stops-section";
import { hikePeriodWalkLabel } from "@/features/hikes/hike-period";
import type { HikeWithRoute } from "@/features/hikes/queries";

type Driver = { id: string; full_name: string };

export function AdminHikeRouteSection({
  entry,
  drivers,
  dateLabel,
  date,
  addableAsNeededDogs = [],
}: {
  entry: HikeWithRoute;
  drivers: Driver[];
  dateLabel?: string;
  date?: string;
  addableAsNeededDogs?: AddableAsNeededDog[];
}) {
  const { route, period, hike } = entry;
  const stops = (hike?.stops ?? []) as Parameters<
    typeof HikeStopsSection
  >[0]["stops"];

  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-stone-900">
            {route.name}
            <span className="font-normal text-stone-500">
              {" "}
              — {hikePeriodWalkLabel(period)}
            </span>
          </h2>
          {dateLabel ? (
            <span className="text-sm text-stone-500">{dateLabel}</span>
          ) : null}
          {hike ? <HikeStatusBadge status={hike.status} /> : null}
        </div>
        {hike ? (
          <CompleteHikeButton hikeId={hike.id} status={hike.status} />
        ) : null}
      </div>

      {hike ? (
        <div className="mt-4 mb-6">
          <DriverSelect
            hikeId={hike.id}
            currentDriverId={hike.driver_id}
            drivers={drivers}
          />
        </div>
      ) : null}

      {date && addableAsNeededDogs.length > 0 ? (
        <div className={hike ? "mb-6" : "mt-4"}>
          <p className="mb-2 text-sm text-stone-600">
            Book an as-needed dog onto this day&apos;s {hikePeriodWalkLabel(period)}.
            This does not change their long-term schedule.
          </p>
          <HikeAddAsNeededDogSelect
            routeId={route.id}
            date={date}
            period={period}
            dogs={addableAsNeededDogs}
          />
        </div>
      ) : null}

      {hike ? (
        <div className="space-y-10">
          <HikeStopsSection
            hikeId={hike.id}
            routeId={route.id}
            date={date}
            period={period}
            stopType="pickup"
            title="Pickups"
            stops={stops}
          />
          <HikeStopsSection
            hikeId={hike.id}
            routeId={route.id}
            date={date}
            period={period}
            stopType="dropoff"
            title="Drop-offs"
            stops={stops}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">No dogs scheduled yet.</p>
      )}
    </section>
  );
}
