import type { SupabaseClient } from "@supabase/supabase-js";
import { getDateInTimezone } from "@/lib/dates";
import { applyStopReorder } from "@/features/hikes/reorder-stops";

export function dropoffSortOrderFromPickupIndex(
  pickupIndex: number,
  pickupCount: number
): number {
  if (pickupCount <= 0) return 0;
  return pickupCount - 1 - pickupIndex;
}

/** Map pickup stop order → dropoff stop ids in reverse visit order. */
export async function dropoffStopIdsReversedFromPickups(
  supabase: SupabaseClient,
  hikeId: string,
  orderedPickupStopIds: string[]
): Promise<string[]> {
  const dropoffIds: string[] = [];

  for (const pickupId of orderedPickupStopIds) {
    const { data: pickup } = await supabase
      .from("stops")
      .select("dog_id")
      .eq("id", pickupId)
      .eq("hike_id", hikeId)
      .eq("stop_type", "pickup")
      .maybeSingle();

    if (!pickup?.dog_id) continue;

    const { data: dropoff } = await supabase
      .from("stops")
      .select("id")
      .eq("hike_id", hikeId)
      .eq("dog_id", pickup.dog_id)
      .eq("stop_type", "dropoff")
      .maybeSingle();

    if (dropoff?.id) dropoffIds.push(dropoff.id);
  }

  return dropoffIds.reverse();
}

export async function applyPickupReorderWithReverseDropoff(
  supabase: SupabaseClient,
  hikeId: string,
  orderedPickupStopIds: string[]
): Promise<string | null> {
  const pickupError = await applyStopReorder(
    supabase,
    hikeId,
    "pickup",
    orderedPickupStopIds
  );
  if (pickupError) return pickupError;

  const dropoffStopIds = await dropoffStopIdsReversedFromPickups(
    supabase,
    hikeId,
    orderedPickupStopIds
  );

  if (dropoffStopIds.length === 0) return null;

  return applyStopReorder(supabase, hikeId, "dropoff", dropoffStopIds);
}

/** Keep drop-off visit order aligned with pickup order (last pickup → first drop-off). */
export async function syncDropoffOrderFromPickupStops(
  supabase: SupabaseClient,
  hikeId: string
): Promise<string | null> {
  const { data: pickupRows } = await supabase
    .from("stops")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup")
    .order("sort_order");

  const pickups = (pickupRows ?? []).filter(
    (p) => p.status !== "cancelled" && p.status !== "skipped"
  );

  if (pickups.length === 0) return null;

  const orderedPickupStopIds = pickups.map((p) => p.id);
  const desiredDropoffIds = await dropoffStopIdsReversedFromPickups(
    supabase,
    hikeId,
    orderedPickupStopIds
  );

  if (desiredDropoffIds.length === 0) return null;

  const { data: dropoffRows } = await supabase
    .from("stops")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("stop_type", "dropoff")
    .order("sort_order");

  const dropoffs = (dropoffRows ?? []).filter(
    (d) => d.status !== "cancelled" && d.status !== "skipped"
  );
  const currentIds = dropoffs.map((d) => d.id);
  if (
    currentIds.length === desiredDropoffIds.length &&
    currentIds.every((id, i) => id === desiredDropoffIds[i])
  ) {
    return null;
  }

  return applyStopReorder(supabase, hikeId, "dropoff", desiredDropoffIds);
}

/** Append newly added dogs to the end of an existing daily pickup plan. */
export async function appendNewDogsToDailyPlan(
  supabase: SupabaseClient,
  hikeId: string,
  newDogIds: string[],
  newDogsInAppendOrder: { id: string }[]
): Promise<string | null> {
  if (newDogIds.length === 0) return null;

  const { data: pickupRows } = await supabase
    .from("stops")
    .select("id, dog_id, status, sort_order")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup")
    .order("sort_order");

  const active = (pickupRows ?? []).filter(
    (p) => p.status !== "cancelled" && p.status !== "skipped"
  );

  const newDogIdSet = new Set(newDogIds);
  const existingOrdered = active
    .filter((p) => !newDogIdSet.has(p.dog_id))
    .map((p) => p.id);

  const pickupByDogId = new Map(active.map((p) => [p.dog_id, p.id]));
  const appendedIds = newDogsInAppendOrder
    .map((dog) => pickupByDogId.get(dog.id))
    .filter((id): id is string => id != null);

  return applyPickupReorderWithReverseDropoff(supabase, hikeId, [
    ...existingOrdered,
    ...appendedIds,
  ]);
}

/** Recompute pickup + drop-off sort_order without unique-constraint conflicts. */
export async function resyncHikeStopSortOrders(
  supabase: SupabaseClient,
  hikeId: string,
  dogsInRouteOrder: { id: string }[]
): Promise<string | null> {
  const orderedPickupStopIds = await fetchPickupStopIdsForDogsInOrder(
    supabase,
    hikeId,
    dogsInRouteOrder
  );
  if (orderedPickupStopIds.length === 0) return null;

  const pickupError = await applyStopReorder(
    supabase,
    hikeId,
    "pickup",
    orderedPickupStopIds
  );
  if (pickupError) return pickupError;

  return syncDropoffOrderFromPickupStops(supabase, hikeId);
}

async function fetchPickupStopIdsForDogsInOrder(
  supabase: SupabaseClient,
  hikeId: string,
  dogsInRouteOrder: { id: string }[]
): Promise<string[]> {
  const ids: string[] = [];

  for (const dog of dogsInRouteOrder) {
    const { data: stop } = await supabase
      .from("stops")
      .select("id, status")
      .eq("hike_id", hikeId)
      .eq("dog_id", dog.id)
      .eq("stop_type", "pickup")
      .maybeSingle();

    if (
      stop &&
      stop.status !== "cancelled" &&
      stop.status !== "skipped"
    ) {
      ids.push(stop.id);
    }
  }

  return ids;
}

/** Recompute stop sort_order from dogs.route_sort_order (pickup forward, dropoff reverse). */
export async function resyncHikeStopSortFromRouteDogs(
  supabase: SupabaseClient,
  hikeId: string,
  routeId: string
): Promise<string | null> {
  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, route_sort_order")
    .eq("route_id", routeId)
    .eq("is_active", true)
    .order("route_sort_order");

  return resyncHikeStopSortOrders(supabase, hikeId, dogs ?? []);
}

export async function resyncHikeStopSortForRoute(
  supabase: SupabaseClient,
  companyId: string,
  routeId: string,
  timeZone: string
): Promise<void> {
  const today = getDateInTimezone(timeZone, 0);
  const tomorrow = getDateInTimezone(timeZone, 1);

  for (const date of [today, tomorrow]) {
    const { data: hike } = await supabase
      .from("hikes")
      .select("id")
      .eq("company_id", companyId)
      .eq("route_id", routeId)
      .eq("date", date)
      .maybeSingle();

    if (!hike) continue;

    await resyncHikeStopSortFromRouteDogs(supabase, hike.id, routeId);
  }
}
