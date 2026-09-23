"use client";

import { assignVehicleAction } from "@/features/hikes/actions";
import { vehicleDisplayLabel } from "@/features/vehicles/schema";

type VehicleOption = {
  id: string;
  name: string;
  plate: string | null;
};

type VehicleSelectProps = {
  hikeId: string;
  currentVehicleId: string | null;
  vehicles: VehicleOption[];
};

export function VehicleSelect({
  hikeId,
  currentVehicleId,
  vehicles,
}: VehicleSelectProps) {
  async function assign(formData: FormData) {
    const vehicleId = String(formData.get("vehicle_id") || "") || null;
    await assignVehicleAction(hikeId, vehicleId);
  }

  return (
    <form action={assign} className="flex items-center gap-2">
      <label htmlFor={`vehicle-${hikeId}`} className="text-sm text-stone-600">
        Vehicle:
      </label>
      <select
        id={`vehicle-${hikeId}`}
        name="vehicle_id"
        defaultValue={currentVehicleId ?? ""}
        className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
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
