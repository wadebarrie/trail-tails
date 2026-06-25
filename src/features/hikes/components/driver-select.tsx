"use client";

import { assignDriverAction } from "@/features/hikes/actions";

type Driver = { id: string; full_name: string };

type DriverSelectProps = {
  hikeId: string;
  currentDriverId: string | null;
  drivers: Driver[];
};

export function DriverSelect({
  hikeId,
  currentDriverId,
  drivers,
}: DriverSelectProps) {
  async function assign(formData: FormData) {
    const driverId = String(formData.get("driver_id") || "") || null;
    await assignDriverAction(hikeId, driverId);
  }

  return (
    <form action={assign} className="flex items-center gap-2">
      <label htmlFor={`driver-${hikeId}`} className="text-sm text-stone-600">
        Driver:
      </label>
      <select
        id={`driver-${hikeId}`}
        name="driver_id"
        defaultValue={currentDriverId ?? ""}
        className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Unassigned</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.full_name}
          </option>
        ))}
      </select>
    </form>
  );
}
