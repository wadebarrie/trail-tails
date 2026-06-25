import { requireRole } from "@/features/auth/queries";
import { DriverStopList } from "@/features/driver-actions/components/driver-stop-list";
import {
  getDriverCompanyTimezone,
  getDriverTodayView,
} from "@/features/driver-actions/queries";

export default async function DriverTodayPage() {
  const profile = await requireRole("driver");
  const timeZone = await getDriverCompanyTimezone(profile.company_id);
  const day = await getDriverTodayView(profile.company_id, timeZone);

  const pendingPickups = day.pickups.filter((s) => s.status !== "picked_up").length;
  const pendingDropoffs = day.dropoffs.filter((s) => s.status !== "dropped_off").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">Today</h1>
      <p className="mt-1 text-white/70">{day.dateLabel}</p>

      <div className="mt-4 flex gap-3 text-sm">
        <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
          {pendingPickups} pickup{pendingPickups === 1 ? "" : "s"} left
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
          {pendingDropoffs} drop-off{pendingDropoffs === 1 ? "" : "s"} left
        </span>
      </div>

      <div className="mt-8 space-y-10">
        <DriverStopList
          title="Morning pickups"
          stops={day.pickups}
          emptyMessage="No pickups scheduled today."
        />
        <DriverStopList
          title="Afternoon drop-offs"
          stops={day.dropoffs}
          emptyMessage="No drop-offs scheduled today."
        />
      </div>
    </div>
  );
}
