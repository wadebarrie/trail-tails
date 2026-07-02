import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { SyncRoutesButton } from "@/features/hikes/components/sync-routes-button";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { listAddableAsNeededDogsForRouteDate } from "@/features/dogs/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

export default async function TodayHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const tz = await getCompanyTimezone(profile.company_id);
  const date = getDateInTimezone(tz, 0);

  const hikes = await getHikesWithStopsForDate(profile.company_id, date, {
    timeZone: tz,
  });

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .eq("is_active", true)
    .order("full_name");

  const withStops = hikes.filter((h) => (h.hike?.stops?.length ?? 0) > 0);
  const runningRoutes = hikes;
  const addableByRoutePeriod = new Map(
    await Promise.all(
      runningRoutes.map(async (entry) => [
        `${entry.route.id}:${entry.period}`,
        await listAddableAsNeededDogsForRouteDate(
          profile.company_id,
          entry.route.id,
          date,
          entry.period
        ),
      ] as const)
    )
  );

  return (
    <div>
      <PageHeader
        title="Today"
        description={`${formatDateLabel(date, tz)} — build and adjust today's route plan without changing dogs' long-term schedules.`}
        action={<SyncRoutesButton offsetDays={0} />}
      />

      {runningRoutes.length > 0 ? (
        <div className="space-y-8">
          {runningRoutes.map((entry) => (
            <AdminHikeRouteSection
              key={`${entry.route.id}:${entry.period}`}
              entry={entry}
              drivers={drivers ?? []}
              date={date}
              addableAsNeededDogs={
                addableByRoutePeriod.get(`${entry.route.id}:${entry.period}`) ??
                []
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No hikes scheduled for today." />
      )}

      {withStops.length === 0 && runningRoutes.length > 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No dogs on today&apos;s routes yet. Add as-needed dogs above, or sync
          routes after schedule changes.
        </p>
      ) : null}
    </div>
  );
}
