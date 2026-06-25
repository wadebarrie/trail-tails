"use client";

import { assignRouteDriverAction } from "@/features/routes/actions";

type Driver = { id: string; full_name: string };

export function RouteDriverSelect({
  routeId,
  currentDriverId,
  drivers,
}: {
  routeId: string;
  currentDriverId: string | null;
  drivers: Driver[];
}) {
  async function assign(formData: FormData) {
    const driverId = String(formData.get("driver_id") || "") || null;
    await assignRouteDriverAction(routeId, driverId);
  }

  return (
    <form action={assign} className="flex flex-wrap items-center gap-2">
      <label
        htmlFor={`route-driver-${routeId}`}
        className="text-sm text-stone-600"
      >
        Default driver:
      </label>
      <select
        id={`route-driver-${routeId}`}
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
