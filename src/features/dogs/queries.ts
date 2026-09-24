import { createClient } from "@/lib/supabase/server";
import type { HikePeriod } from "@/features/hikes/hike-period";
import { one } from "@/lib/supabase/relations";
import type { AddableAsNeededDog } from "@/features/hikes/components/hike-add-as-needed-dog-select";

type RoutePeriodTarget = { id: string; period: HikePeriod };

function toAddableDog(dog: {
  id: string;
  name: string;
  customers:
    | { owner_name: string }
    | { owner_name: string }[]
    | null;
}): AddableAsNeededDog {
  return {
    id: dog.id,
    name: dog.name,
    ownerName:
      one(
        dog.customers as
          | { owner_name: string }
          | { owner_name: string }[]
      )?.owner_name ?? "",
  };
}

/**
 * Batch addable as-needed dogs for every route on a date (one dogs + one
 * assignments query instead of N×2).
 */
export async function listAddableAsNeededDogsByRouteForDate(
  companyId: string,
  date: string,
  routes: RoutePeriodTarget[]
): Promise<Map<string, AddableAsNeededDog[]>> {
  const result = new Map<string, AddableAsNeededDog[]>();
  for (const route of routes) {
    result.set(route.id, []);
  }
  if (routes.length === 0) return result;

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

  const dogs = (asNeededDogs ?? []).map(toAddableDog);

  for (const route of routes) {
    const assignedElsewhere = new Set(
      (assignments ?? [])
        .filter((row) => row.period === route.period && row.route_id !== route.id)
        .map((row) => row.dog_id)
    );
    const onThisRoute = new Set(
      (assignments ?? [])
        .filter((row) => row.route_id === route.id && row.period === route.period)
        .map((row) => row.dog_id)
    );

    result.set(
      route.id,
      dogs.filter(
        (dog) => !assignedElsewhere.has(dog.id) && !onThisRoute.has(dog.id)
      )
    );
  }

  return result;
}

/** As-needed dogs not yet assigned on this route's date and walk period. */
export async function listAddableAsNeededDogsForRouteDate(
  companyId: string,
  routeId: string,
  date: string,
  period: HikePeriod
): Promise<AddableAsNeededDog[]> {
  const byRoute = await listAddableAsNeededDogsByRouteForDate(companyId, date, [
    { id: routeId, period },
  ]);
  return byRoute.get(routeId) ?? [];
}
