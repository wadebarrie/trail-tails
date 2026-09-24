import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { SyncRoutesButton } from "@/features/hikes/components/sync-routes-button";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { listAddableAsNeededDogsForRouteDate } from "@/features/dogs/queries";
import { listAssignableDrivers } from "@/features/drivers/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

export default async function TomorrowHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const tz = await getCompanyTimezone(profile.company_id);
  const date = getDateInTimezone(tz, 1);

  const hikes = await getHikesWithStopsForDate(profile.company_id, date, {
    timeZone: tz,
  });

  const addableByRouteId = new Map(
    await Promise.all(
      hikes.map(async (entry) => [
        entry.route.id,
        await listAddableAsNeededDogsForRouteDate(
          profile.company_id,
          entry.route.id,
          date,
          entry.route.period
        ),
      ] as const)
    )
  );

  const [drivers, { data: vehicles }] = await Promise.all([
    listAssignableDrivers(profile.company_id, { activeOnly: true }),
    supabase
      .from("vehicles")
      .select("id, name, plate")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Tomorrow"
        description={`${formatDateLabel(date, tz)} — build and adjust tomorrow's hikes without changing dogs' long-term schedules.`}
        action={<SyncRoutesButton offsetDays={1} />}
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
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No hikes scheduled for tomorrow." />
      )}

      {hikes.length > 0 &&
      hikes.every((entry) => (entry.hike?.stops?.length ?? 0) === 0) ? (
        <p className="mt-4 text-sm text-stone-500">
          No dogs on tomorrow&apos;s hikes yet. Add as-needed dogs above, or
          rebuild stops after schedule changes.
        </p>
      ) : null}    </div>
  );
}
