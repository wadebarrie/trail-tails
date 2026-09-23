"use client";

import { DriverDayNav } from "@/features/driver-actions/components/driver-day-nav";
import { LocationServicesIndicator } from "@/features/driver-actions/components/location-services-indicator";
import { DriverPickupReorder } from "@/features/driver-actions/components/driver-pickup-reorder";
import { DriverStopList } from "@/features/driver-actions/components/driver-stop-list";
import { DriverInstallHint } from "@/features/pwa/driver-install-hint";
import { dayProgressMessage } from "@/features/driver-actions/driver-greeting";
import type { DriverDayView } from "@/features/driver-actions/queries";

export function DriverDayView({
  active,
  day,
  preview = false,
}: {
  active: "today" | "tomorrow";
  day: DriverDayView;
  preview?: boolean;
}) {
  const title = active === "today" ? "Today" : "Tomorrow";
  const emptyMessage =
    active === "today"
      ? "No hikes on your routes today. If that seems wrong, check with the office — they may still be assigning drivers."
      : "Nothing on your routes for tomorrow yet. Check back later or ask the office if you expected work.";

  const progressMessage = dayProgressMessage(day);

  return (
    <div>
      <DriverDayNav active={active} />

      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-white/70">{day.dateLabel}</p>

      {preview ? (
        <p className="mt-2 text-sm text-white/50">
          Preview only — actions unlock on the day of the hike.
        </p>
      ) : null}

      {!preview ? <DriverInstallHint /> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <LocationServicesIndicator />
        {progressMessage ? (
          <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90">
            {progressMessage}
          </span>
        ) : null}
      </div>

      {day.routes.length > 0 ? (
        <div className="mt-8 space-y-12">
          {day.routes.map((route) => (
            <section key={route.hikeId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white/90">
                  {route.routeName}
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  {route.vehicleLabel
                    ? `Vehicle: ${route.vehicleLabel}`
                    : "Vehicle: not assigned"}
                </p>
              </div>
              <div className="space-y-10">
                <DriverPickupReorder
                  hikeId={route.hikeId}
                  pickups={route.pickups}
                />
                <DriverStopList
                  title="Pickups"
                  stops={route.pickups}
                  emptyMessage={
                    preview
                      ? "No pickups scheduled."
                      : "No pickups scheduled today."
                  }
                  readOnly={preview}
                />
                <DriverStopList
                  title="Drop-offs"
                  stops={route.dropoffs}
                  emptyMessage={
                    preview
                      ? "No drop-offs scheduled."
                      : "No drop-offs scheduled today."
                  }
                  readOnly={preview}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 surface-glass-dark rounded-[var(--radius-card)] border border-dashed border-white/20 px-5 py-10 text-center">
          <p className="text-base font-medium text-white/90">Day off the calendar</p>
          <p className="mt-2 text-sm text-white/60">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
