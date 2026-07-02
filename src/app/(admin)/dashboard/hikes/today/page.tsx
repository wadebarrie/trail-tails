import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { SyncRoutesButton } from "@/features/hikes/components/sync-routes-button";
import {
  getHikesNeedingCloseOut,
  getHikesWithStopsForDate,
} from "@/features/hikes/queries";
import { listAddableAsNeededDogsForRouteDate } from "@/features/dogs/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

export default async function TodayHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const tz = await getCompanyTimezone(profile.company_id);
  const date = getDateInTimezone(tz, 0);

  const [hikes, closeOutHikes] = await Promise.all([
    getHikesWithStopsForDate(profile.company_id, date, { timeZone: tz }),
    getHikesNeedingCloseOut(profile.company_id, date),
  ]);

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .eq("is_active", true)
    .order("full_name");

  const withStops = hikes.filter((h) => (h.hike?.stops?.length ?? 0) > 0);
  const runningRoutes = hikes;
  const addableByRouteId = new Map(
    await Promise.all(
      runningRoutes.map(async (entry) => [
        entry.route.id,
        await listAddableAsNeededDogsForRouteDate(
          profile.company_id,
          entry.route.id,
          date
        ),
      ] as const)
    )
  );
  const openCloseOut = closeOutHikes.filter(
    (h) => h.hike && (h.hike.stops?.length ?? 0) > 0
  );

  return (
    <div>
      <PageHeader
        title="Today"
        description={`${formatDateLabel(date, tz)} — build and adjust today's route plan without changing dogs' long-term schedules.`}
        action={<SyncRoutesButton offsetDays={0} />}
      />

      {openCloseOut.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-1 text-base font-semibold text-amber-900">
            Needs close-out
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            Past hikes still open — use <strong>Mark hike complete</strong> after
            the driver finishes.
          </p>
          <div className="space-y-8">
            {openCloseOut.map((entry) => (
              <AdminHikeRouteSection
                key={`closeout-${entry.hike!.id}`}
                entry={entry}
                drivers={drivers ?? []}
                dateLabel={formatDateLabel(entry.hike!.date, tz)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {runningRoutes.length > 0 ? (
        <div className="space-y-8">
          {runningRoutes.map((entry) => (
            <AdminHikeRouteSection
              key={entry.route.id}
              entry={entry}
              drivers={drivers ?? []}
              date={date}
              addableAsNeededDogs={addableByRouteId.get(entry.route.id) ?? []}
            />
          ))}
        </div>
      ) : openCloseOut.length === 0 ? (
        <EmptyState message="No hikes scheduled for today." />
      ) : null}

      {withStops.length === 0 && runningRoutes.length > 0 && openCloseOut.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No dogs on today&apos;s routes yet. Add as-needed dogs above, or sync
          routes after schedule changes.
        </p>
      ) : null}
    </div>
  );
}
