"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignRouteVehicleAction } from "@/features/routes/actions";
import { vehicleDisplayLabel } from "@/features/vehicles/schema";

type VehicleOption = {
  id: string;
  name: string;
  plate: string | null;
};

export function RouteVehicleSelect({
  routeId,
  currentVehicleId,
  vehicles,
  label = "Default vehicle:",
}: {
  routeId: string;
  currentVehicleId: string | null;
  vehicles: VehicleOption[];
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function assign(formData: FormData) {
    const vehicleId = String(formData.get("vehicle_id") || "") || null;
    startTransition(async () => {
      await assignRouteVehicleAction(routeId, vehicleId);
      router.refresh();
    });
  }

  return (
    <form action={assign} className="flex flex-wrap items-center gap-2">
      <label
        htmlFor={`route-vehicle-${routeId}`}
        className="text-sm text-stone-600"
      >
        {label}
      </label>
      <select
        id={`route-vehicle-${routeId}`}
        name="vehicle_id"
        defaultValue={currentVehicleId ?? ""}
        key={currentVehicleId ?? "none"}
        disabled={pending}
        className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm disabled:opacity-60"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Unassigned</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {vehicleDisplayLabel(v)}
          </option>
        ))}
      </select>
    </form>
  );
}
