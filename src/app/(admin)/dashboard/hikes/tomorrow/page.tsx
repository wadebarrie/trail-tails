import { PageHeader, EmptyState } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { AdminHikeRouteSection } from "@/features/hikes/components/admin-hike-route-section";
import { getHikesWithStopsForDate } from "@/features/hikes/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateLabel, getDateInTimezone } from "@/lib/dates";

export default async function TomorrowHikesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", profile.company_id)
    .single();

  const tz = company?.timezone ?? "America/Los_Angeles";
  const date = getDateInTimezone(tz, 1);

  const hikes = await getHikesWithStopsForDate(profile.company_id, date);

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .eq("is_active", true)
    .order("full_name");

  const withStops = hikes.filter(
    (h) => (h.hike?.stops?.length ?? 0) > 0
  );

  return (
    <div>
      <PageHeader
        title="Tomorrow"
        description={formatDateLabel(date, tz)}
      />

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
      ) : (
        <EmptyState message="No hikes scheduled for tomorrow." />
      )}
    </div>
  );
}
