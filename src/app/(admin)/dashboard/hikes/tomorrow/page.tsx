import { PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { DriverSelect } from "@/features/hikes/components/driver-select";
import { HikeStopsSection } from "@/features/hikes/components/hike-stops-section";
import { getHikeWithStops } from "@/features/hikes/queries";
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

  const hike = await getHikeWithStops(profile.company_id, date);

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .eq("is_active", true)
    .order("full_name");

  const stops = (hike?.stops ?? []) as unknown as Parameters<
    typeof HikeStopsSection
  >[0]["stops"];

  return (
    <div>
      <PageHeader
        title="Tomorrow"
        description={formatDateLabel(date, tz)}
      />

      {hike ? (
        <div className="mb-6">
          <DriverSelect
            hikeId={hike.id}
            currentDriverId={hike.driver_id}
            drivers={drivers ?? []}
          />
        </div>
      ) : null}

      {hike ? (
        <div className="space-y-10">
          <HikeStopsSection
            hikeId={hike.id}
            stopType="pickup"
            title="Morning pickups"
            stops={stops}
          />
          <HikeStopsSection
            hikeId={hike.id}
            stopType="dropoff"
            title="Afternoon drop-offs"
            stops={stops}
          />
        </div>
      ) : (
        <p className="text-stone-500">No hike scheduled for tomorrow.</p>
      )}
    </div>
  );
}
