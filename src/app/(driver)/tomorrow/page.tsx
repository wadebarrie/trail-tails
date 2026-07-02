import { requireDriverAccess } from "@/features/auth/queries";
import { DriverDayShell } from "@/features/driver-actions/components/driver-day-shell";
import {
  getDriverCompanyTimezone,
  getDriverDayView,
} from "@/features/driver-actions/queries";

export default async function DriverTomorrowPage() {
  const profile = await requireDriverAccess();
  const timeZone = await getDriverCompanyTimezone(profile.company_id);
  const day = await getDriverDayView(
    profile.company_id,
    timeZone,
    profile,
    1
  );

  return (
    <DriverDayShell
      active="tomorrow"
      day={day}
      preview
      driverName={profile.full_name}
      timeZone={timeZone}
      briefingNotes={[]}
    />
  );
}
