import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import {
  getCompanyRouteCadence,
  getCompanyTimezone,
} from "@/features/company/queries";
import { ExceptionSyncFailureBanner } from "@/features/dogs/components/exception-sync-failure-banner";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { SyncRoutesButton } from "@/features/hikes/components/sync-routes-button";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { listAddableAsNeededDogsByRouteForDate } from "@/features/dogs/queries";
import { listAssignableDrivers } from "@/features/drivers/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

export default async function TodayHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [tz, routeCadence] = await Promise.all([
    getCompanyTimezone(profile.company_id),
    getCompanyRouteCadence(profile.company_id),
  ]);
  const date = getDateInTimezone(tz, 0);

  const [hikes, drivers, { data: vehicles }] = await Promise.all([
    getHikesWithStopsForDate(profile.company_id, date, {
      timeZone: tz,
    }),
    listAssignableDrivers(profile.company_id, { activeOnly: true }),
    supabase
      .from("vehicles")
      .select("id, name, plate")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const withStops = hikes.filter((h) => (h.hike?.stops?.length ?? 0) > 0);
  const runningRoutes = hikes;
  const addableByRouteId = await listAddableAsNeededDogsByRouteForDate(
    profile.company_id,
    date,
    runningRoutes.map((entry) => ({
      id: entry.route.id,
      period: entry.route.period,
    }))
  );

  return (
    <div>
      <PageHeader
        title="Today"
        description={`${formatDateLabel(date, tz)} — who’s on the vans today. Changing times or order here is for today only.`}
        action={<SyncRoutesButton offsetDays={0} />}
      />

      <ExceptionSyncFailureBanner companyId={profile.company_id} />

      {runningRoutes.length > 0 ? (
        <div className="space-y-8">
          {runningRoutes.map((entry) => (
            <AdminHikeRouteSection
              key={entry.route.id}
              entry={entry}
              drivers={drivers}
              vehicles={vehicles ?? []}
              date={date}
              addableAsNeededDogs={addableByRouteId.get(entry.route.id) ?? []}
              routeCadence={routeCadence}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          message="Nothing scheduled today. Set which days each route runs on Routes, or check Time off."
          action={
            <a
              href="/dashboard/route"
              className="text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
            >
              Go to Routes →
            </a>
          }
        />
      )}

      {withStops.length === 0 && runningRoutes.length > 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No dogs on today&apos;s list yet. Add a dog for today only above, or tap
          Refresh today&apos;s list after schedule changes.
        </p>
      ) : null}
    </div>
  );
}
