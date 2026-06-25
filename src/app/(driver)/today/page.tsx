import { requireDriverAccess } from "@/features/auth/queries";
import { DriverPickupReorder } from "@/features/driver-actions/components/driver-pickup-reorder";
import { DriverStopList } from "@/features/driver-actions/components/driver-stop-list";
import {
  getDriverCompanyTimezone,
  getDriverTodayView,
} from "@/features/driver-actions/queries";

export default async function DriverTodayPage() {
  const profile = await requireDriverAccess();
  const timeZone = await getDriverCompanyTimezone(profile.company_id);
  const day = await getDriverTodayView(profile.company_id, timeZone);

  const totalPickups = day.routes.reduce(
    (n, r) => n + r.pickups.filter((s) => s.status !== "picked_up").length,
    0
  );
  const totalDropoffs = day.routes.reduce(
    (n, r) => n + r.dropoffs.filter((s) => s.status !== "dropped_off").length,
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Today</h1>
      <p className="mt-1 text-white/70">{day.dateLabel}</p>

      <div className="mt-4 flex gap-3 text-sm">
        <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
          {totalPickups} pickup{totalPickups === 1 ? "" : "s"} left
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
          {totalDropoffs} drop-off{totalDropoffs === 1 ? "" : "s"} left
        </span>
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
                  emptyMessage="No pickups scheduled today."
                />
                <DriverStopList
                  title="Afternoon drop-offs"
                  stops={route.dropoffs}
                  emptyMessage="No drop-offs scheduled today."
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-white/60">No hikes scheduled today.</p>
      )}
    </div>
  );
}
