"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectCompactClassName } from "@/features/admin/components/form-styles";
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
    const driverId = String(formData.get("driver_id") || "") || null;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await assignDriverAction(hikeId, driverId);
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
      <label htmlFor={`driver-${hikeId}`} className="text-sm text-stone-600">
        Driver:
      </label>
      <select
        id={`driver-${hikeId}`}
        name="driver_id"
        defaultValue={currentDriverId ?? ""}
        key={currentDriverId ?? "none"}
        disabled={pending}
        className={selectCompactClassName}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Unassigned</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.full_name}
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
