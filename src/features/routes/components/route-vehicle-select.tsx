"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectCompactClassName } from "@/features/admin/components/form-styles";
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  function assign(formData: FormData) {
    const vehicleId = String(formData.get("vehicle_id") || "") || null;
    setSaved(false);
    startTransition(async () => {
      await assignRouteVehicleAction(routeId, vehicleId);
      setSaved(true);
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
        className={selectCompactClassName}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Unassigned</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {vehicleDisplayLabel(v)}
          </option>
        ))}
      </select>
      {pending ? (
        <span className="text-xs text-stone-500">Saving…</span>
      ) : saved ? (
        <span className="text-xs font-medium text-emerald-700">Saved</span>
      ) : null}
    </form>
  );
}
