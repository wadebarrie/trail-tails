import { Card } from "@/features/admin/components/ui";
import { DriverSelect } from "@/features/hikes/components/driver-select";
import { VehicleSelect } from "@/features/hikes/components/vehicle-select";
import {
  HikeAddAsNeededDogSelect,
  type AddableAsNeededDog,
} from "@/features/hikes/components/hike-add-as-needed-dog-select";
import {
  CompleteHikeButton,
  HikeStatusBadge,
} from "@/features/hikes/components/complete-hike-button";
import { HikeStopsSection } from "@/features/hikes/components/hike-stops-section";
import {
  cadenceRouteTitleSuffix,
  cadenceWalkLabel,
  type RouteCadence,
} from "@/features/company/route-cadence";
import type { HikeWithRoute } from "@/features/hikes/queries";

type Driver = { id: string; full_name: string };
type VehicleOption = { id: string; name: string; plate: string | null };

export function AdminHikeRouteSection({
  entry,
  drivers,
  vehicles,
  dateLabel,
  date,
  addableAsNeededDogs = [],
  routeCadence = "twice",
}: {
  entry: HikeWithRoute;
  drivers: Driver[];
  vehicles: VehicleOption[];
  dateLabel?: string;
  date?: string;
  addableAsNeededDogs?: AddableAsNeededDog[];
  routeCadence?: RouteCadence;
}) {
  const { route, hike } = entry;
  const stops = (hike?.stops ?? []) as Parameters<
    typeof HikeStopsSection
  >[0]["stops"];
  const titleSuffix = cadenceRouteTitleSuffix(route.period, routeCadence);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-stone-900">
            {route.name}
            {titleSuffix ? (
              <span className="font-normal text-stone-500">{titleSuffix}</span>
            ) : null}
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
        <div className="mt-4 mb-6 flex flex-wrap gap-x-6 gap-y-3">
          <DriverSelect
            hikeId={hike.id}
            currentDriverId={hike.driver_id}
            drivers={drivers}
          />
          <VehicleSelect
            hikeId={hike.id}
            currentVehicleId={hike.vehicle_id}
            vehicles={vehicles}
          />
        </div>
      ) : null}

      {date && addableAsNeededDogs.length > 0 ? (
        <div className={hike ? "mb-6" : "mt-4"}>
          <p className="mb-2 text-sm text-stone-600">
            Add a dog for today only on this{" "}
            {cadenceWalkLabel(route.period, routeCadence)}. This does not change
            their usual weekly schedule.
          </p>
          <HikeAddAsNeededDogSelect
            routeId={route.id}
            date={date}
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
            stopType="pickup"
            title="Pickups"
            stops={stops}
          />
          <HikeStopsSection
            hikeId={hike.id}
            routeId={route.id}
            date={date}
            stopType="dropoff"
            title="Drop-offs"
            stops={stops}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">No dogs scheduled yet.</p>
      )}
    </Card>
  );
}
