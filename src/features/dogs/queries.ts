import { createClient } from "@/lib/supabase/server";
import type { HikePeriod } from "@/features/hikes/hike-period";
import { one } from "@/lib/supabase/relations";
import type { AddableAsNeededDog } from "@/features/hikes/components/hike-add-as-needed-dog-select";

/** As-needed dogs not yet assigned on this date and walk period. */
export async function listAddableAsNeededDogsForRouteDate(
  companyId: string,
  routeId: string,
  date: string,
  period: HikePeriod
): Promise<AddableAsNeededDog[]> {
  const supabase = await createClient();

  const [{ data: asNeededDogs }, { data: assignments }] = await Promise.all([
    supabase
      .from("dogs")
      .select("id, name, customers ( owner_name )")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("schedule_type", "as_needed")
      .order("name"),
    supabase
      .from("dog_day_assignments")
      .select("dog_id, route_id, period")
      .eq("company_id", companyId)
      .eq("date", date),
  ]);

  const assignedElsewhere = new Set(
    (assignments ?? [])
      .filter((row) => row.period === period && row.route_id !== routeId)
      .map((row) => row.dog_id)
  );

  const onThisRoute = new Set(
    (assignments ?? [])
      .filter((row) => row.route_id === routeId && row.period === period)
      .map((row) => row.dog_id)
  );

  return (asNeededDogs ?? [])
    .filter((dog) => !assignedElsewhere.has(dog.id) && !onThisRoute.has(dog.id))
    .map((dog) => ({
      id: dog.id,
      name: dog.name,
      ownerName:
        one(
          dog.customers as
            | { owner_name: string }
            | { owner_name: string }[]
        )?.owner_name ?? "",
    }));
}
