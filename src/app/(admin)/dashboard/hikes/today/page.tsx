import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { SyncRoutesButton } from "@/features/hikes/components/sync-routes-button";
import {
  getHikesNeedingCloseOut,
  getHikesWithStopsForDate,
} from "@/features/hikes/queries";
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
  const openCloseOut = closeOutHikes.filter(
    (h) => h.hike && (h.hike.stops?.length ?? 0) > 0
  );

  return (
    <div>
      <PageHeader
        title="Today"
        description={formatDateLabel(date, tz)}
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

      {withStops.length > 0 ? (
        <div className="space-y-8">
          {withStops.map((entry) => (
            <AdminHikeRouteSection
              key={entry.route.id}
              entry={entry}
              drivers={drivers ?? []}
            />
          ))}
        </div>
      ) : openCloseOut.length === 0 ? (
        <EmptyState message="No hikes scheduled for today." />
      ) : null}
    </div>
  );
}
