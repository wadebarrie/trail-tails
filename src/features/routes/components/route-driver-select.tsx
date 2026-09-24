"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectCompactClassName } from "@/features/admin/components/form-styles";
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  function assign(formData: FormData) {
    const driverId = String(formData.get("driver_id") || "") || null;
    setSaved(false);
    startTransition(async () => {
      await assignRouteDriverAction(routeId, driverId);
      setSaved(true);
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
    </form>
  );
}
