"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignRouteDriverAction } from "@/features/routes/actions";

type Driver = { id: string; full_name: string };

export function RouteDriverSelect({
  routeId,
  currentDriverId,
  drivers,
  label = "Default driver:",
}: {
  routeId: string;
  currentDriverId: string | null;
  drivers: Driver[];
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function assign(formData: FormData) {
    const driverId = String(formData.get("driver_id") || "") || null;
    startTransition(async () => {
      await assignRouteDriverAction(routeId, driverId);
      router.refresh();
    });
  }

  return (
    <form action={assign} className="flex flex-wrap items-center gap-2">
      <label
        htmlFor={`route-driver-${routeId}`}
        className="text-sm text-stone-600"
      >
        {label}
      </label>
      <select
        id={`route-driver-${routeId}`}
        name="driver_id"
        defaultValue={currentDriverId ?? ""}
        key={currentDriverId ?? "none"}
        disabled={pending}
        className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm disabled:opacity-60"
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
