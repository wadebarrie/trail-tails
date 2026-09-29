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

export default async function TomorrowHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [tz, routeCadence] = await Promise.all([
    getCompanyTimezone(profile.company_id),
    getCompanyRouteCadence(profile.company_id),
  ]);
  const date = getDateInTimezone(tz, 1);

  const [initialHikes, drivers, { data: vehicles }] = await Promise.all([
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

  // Routes are scheduled but hike rows/stops missing (cron hasn't built tomorrow yet).
  const needsPopulate =
    initialHikes.length > 0 &&
    initialHikes.every((entry) => (entry.hike?.stops?.length ?? 0) === 0);

  const hikes = needsPopulate
    ? await getHikesWithStopsForDate(profile.company_id, date, {
        timeZone: tz,
        sync: true,
      })
    : initialHikes;

  const addableByRouteId = await listAddableAsNeededDogsByRouteForDate(
    profile.company_id,
    date,
    hikes.map((entry) => ({
      id: entry.route.id,
      period: entry.route.period,
    }))
  );

  return (
    <div>
      <PageHeader
        title="Tomorrow"
        description={`${formatDateLabel(date, tz)} — plan tomorrow’s vans. Changing times or order here is for tomorrow only.`}
        action={<SyncRoutesButton offsetDays={1} />}
      />

      <ExceptionSyncFailureBanner
        companyId={profile.company_id}
        rebuildHref="/dashboard/hikes/tomorrow"
      />

      {hikes.length > 0 ? (
        <div className="space-y-8">
          {hikes.map((entry) => (
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
          message="Nothing scheduled tomorrow. Set which days each route runs on Routes, or check Time off."
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

      {hikes.length > 0 &&
      hikes.every((entry) => (entry.hike?.stops?.length ?? 0) === 0) ? (
        <p className="mt-4 text-sm text-stone-500">
          No dogs on tomorrow&apos;s list yet. Add a dog for tomorrow only above,
          or tap Refresh tomorrow&apos;s list after schedule changes.
        </p>
      ) : null}
    </div>
  );
}
