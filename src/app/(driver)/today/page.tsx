import { requireDriverAccess } from "@/features/auth/queries";
import { DriverDayShell } from "@/features/driver-actions/components/driver-day-shell";
import { getDriverBriefingNotes } from "@/features/driver-actions/briefing-notes";
import {
  getDriverCompanyTimezone,
  getDriverDayView,
} from "@/features/driver-actions/queries";
import { PerfTimer } from "@/lib/perf";

export default async function DriverTodayPage() {
  const timer = new PerfTimer("page driver-today");
  const profile = await requireDriverAccess();
  timer.mark("auth");
  const timeZone = await getDriverCompanyTimezone(profile.company_id);
  timer.mark("timezone");
  const day = await getDriverDayView(
    profile.company_id,
    timeZone,
    profile,
    0
  );
  timer.mark("day-view");

  const routeIds = day.routes.map((r) => r.routeId);
  const briefingNotes = await getDriverBriefingNotes(
    profile.company_id,
    day.date,
    routeIds
  );
  timer.end();

  return (
    <DriverDayShell
      active="today"
      day={day}
      driverName={profile.full_name}
      timeZone={timeZone}
      briefingNotes={briefingNotes}
    />
  );
}
