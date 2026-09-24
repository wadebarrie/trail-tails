"use client";

import { useState } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { DeleteRouteButton } from "@/features/routes/components/delete-route-button";
import { EditRouteForm } from "@/features/routes/components/route-form";
import type { HikePeriod } from "@/features/hikes/hike-period";

export function RouteEditPanel({
  routeId,
  routeName,
  defaultDays,
  defaultPeriod,
  dogCount,
}: {
  routeId: string;
  routeName: string;
  defaultDays: number[];
  defaultPeriod: HikePeriod;
  dogCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className={secondaryButtonClassName}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close editor" : "Edit route"}
        </button>
        {open ? (
          <DeleteRouteButton
            routeId={routeId}
            routeName={routeName}
            dogCount={dogCount}
          />
        ) : null}
      </div>

      {open ? (
        <div className="surface-card rounded-[var(--radius-surface)] p-4">
          <EditRouteForm
            routeId={routeId}
            defaultName={routeName}
            defaultDays={defaultDays}
            defaultPeriod={defaultPeriod}
          />
        </div>
      ) : null}
    </div>
  );
}
