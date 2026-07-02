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
      ? "No hikes scheduled today."
      : "No hikes scheduled tomorrow.";

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
            <section key={route.routeId}>
              <h2 className="mb-4 text-lg font-semibold text-white/90">
                {route.routeName}
              </h2>
              <div className="space-y-10">
                <DriverPickupReorder
                  hikeId={route.hikeId}
                  pickups={route.pickups}
                />
                <DriverStopList
                  title="Morning pickups"
                  stops={route.pickups}
                  emptyMessage={
                    preview
                      ? "No pickups scheduled."
                      : "No pickups scheduled today."
                  }
                  readOnly={preview}
                />
                <DriverStopList
                  title="Afternoon drop-offs"
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
        <p className="mt-8 text-white/60">{emptyMessage}</p>
      )}
    </div>
  );
}
