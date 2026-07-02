import { requireDriverAccess } from "@/features/auth/queries";
import { DriverDayShell } from "@/features/driver-actions/components/driver-day-shell";
import { getDriverBriefingNotes } from "@/features/driver-actions/briefing-notes";
import {
  getDriverCompanyTimezone,
  getDriverDayView,
} from "@/features/driver-actions/queries";

export default async function DriverTodayPage() {
  const profile = await requireDriverAccess();
  const timeZone = await getDriverCompanyTimezone(profile.company_id);
  const day = await getDriverDayView(
    profile.company_id,
    timeZone,
    profile,
    0
  );

  const routeIds = day.routes.map((r) => r.routeId);
  const briefingNotes = await getDriverBriefingNotes(
    profile.company_id,
    day.date,
    routeIds
  );

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
