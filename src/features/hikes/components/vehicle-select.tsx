"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectCompactClassName } from "@/features/admin/components/form-styles";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  function assign(formData: FormData) {
    const vehicleId = String(formData.get("vehicle_id") || "") || null;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await assignVehicleAction(hikeId, vehicleId);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={assign} className="flex flex-wrap items-center gap-2">
      <label htmlFor={`vehicle-${hikeId}`} className="text-sm text-stone-600">
        Vehicle:
      </label>
      <select
        id={`vehicle-${hikeId}`}
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
      {error ? (
        <span className="w-full text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}
