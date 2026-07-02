"use client";

import { assignRouteDriverAction } from "@/features/routes/actions";
import type { HikePeriod } from "@/features/hikes/hike-period";

type Driver = { id: string; full_name: string };

export function RouteDriverSelect({
  routeId,
  currentDriverId,
  drivers,
  period = "morning",
  label,
}: {
  routeId: string;
  currentDriverId: string | null;
  drivers: Driver[];
  period?: HikePeriod;
  label?: string;
}) {
  async function assign(formData: FormData) {
    const driverId = String(formData.get("driver_id") || "") || null;
    await assignRouteDriverAction(routeId, driverId, period);
  }

  const selectId = `route-driver-${routeId}-${period}`;

  return (
    <form action={assign} className="flex flex-wrap items-center gap-2">
      <label htmlFor={selectId} className="text-sm text-stone-600">
        {label ?? "Default driver:"}
      </label>
      <select
        id={selectId}
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
