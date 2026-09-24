import type { SupabaseClient } from "@supabase/supabase-js";
import { getDateInTimezone } from "@/lib/dates";
import { applyStopReorder } from "@/features/hikes/reorder-stops";

type StopRow = { id: string; dog_id: string; status: string; sort_order: number };

function isOpenStopStatus(status: string) {
  return status !== "cancelled" && status !== "skipped";
}

function isIncompleteStopStatus(status: string) {
  return status === "scheduled" || status === "en_route" || status === "arrived";
}

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
  if (orderedPickupStopIds.length === 0) return [];

  const [{ data: pickups }, { data: dropoffs }] = await Promise.all([
    supabase
      .from("stops")
      .select("id, dog_id")
      .eq("hike_id", hikeId)
      .eq("stop_type", "pickup")
      .in("id", orderedPickupStopIds),
    supabase
      .from("stops")
      .select("id, dog_id")
      .eq("hike_id", hikeId)
      .eq("stop_type", "dropoff"),
  ]);

  const dogIdByPickupId = new Map(
    (pickups ?? []).map((row) => [row.id, row.dog_id] as const)
  );
  const dropoffIdByDogId = new Map(
    (dropoffs ?? []).map((row) => [row.dog_id, row.id] as const)
  );

  const dropoffIds: string[] = [];
  for (const pickupId of orderedPickupStopIds) {
    const dogId = dogIdByPickupId.get(pickupId);
    if (!dogId) continue;
    const dropoffId = dropoffIdByDogId.get(dogId);
    if (dropoffId) dropoffIds.push(dropoffId);
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

/**
 * Mid-route pickup reorder: completed pickups stay fixed at the front;
 * only incomplete pickups are reordered. Incomplete drop-offs follow the
 * reverse of the new pickup order; completed drop-offs stay first.
 */
export async function applyMidRoutePickupReorder(
  supabase: SupabaseClient,
  hikeId: string,
  orderedIncompletePickupIds: string[]
): Promise<string | null> {
  const { data: pickupRows } = await supabase
    .from("stops")
    .select("id, dog_id, status, sort_order")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup")
    .order("sort_order");

  const pickups = (pickupRows ?? []) as StopRow[];
  const completed = pickups.filter(
    (p) => isOpenStopStatus(p.status) && !isIncompleteStopStatus(p.status)
  );
  const incomplete = pickups.filter((p) => isIncompleteStopStatus(p.status));

  if (incomplete.length !== orderedIncompletePickupIds.length) {
    return "Invalid pickup order.";
  }
  const incompleteIds = new Set(incomplete.map((p) => p.id));
  if (!orderedIncompletePickupIds.every((id) => incompleteIds.has(id))) {
    return "Invalid pickup order.";
  }

  const newPickupOrder = [
    ...completed.map((p) => p.id),
    ...orderedIncompletePickupIds,
  ];

  const pickupError = await applyStopReorder(
    supabase,
    hikeId,
    "pickup",
    newPickupOrder
  );
  if (pickupError) return pickupError;

  return syncDropoffsPreservingCompleted(supabase, hikeId, newPickupOrder);
}

/** Reorder incomplete drop-offs only; completed drop-offs stay first. */
export async function applyMidRouteDropoffReorder(
  supabase: SupabaseClient,
  hikeId: string,
  orderedIncompleteDropoffIds: string[]
): Promise<string | null> {
  const { data: dropoffRows } = await supabase
    .from("stops")
    .select("id, dog_id, status, sort_order")
    .eq("hike_id", hikeId)
    .eq("stop_type", "dropoff")
    .order("sort_order");

  const dropoffs = (dropoffRows ?? []) as StopRow[];
  const completed = dropoffs.filter(
    (d) => isOpenStopStatus(d.status) && !isIncompleteStopStatus(d.status)
  );
  const incomplete = dropoffs.filter((d) => isIncompleteStopStatus(d.status));

  if (incomplete.length !== orderedIncompleteDropoffIds.length) {
    return "Invalid drop-off order.";
  }
  const incompleteIds = new Set(incomplete.map((d) => d.id));
  if (!orderedIncompleteDropoffIds.every((id) => incompleteIds.has(id))) {
    return "Invalid drop-off order.";
  }

  return applyStopReorder(supabase, hikeId, "dropoff", [
    ...completed.map((d) => d.id),
    ...orderedIncompleteDropoffIds,
  ]);
}

async function syncDropoffsPreservingCompleted(
  supabase: SupabaseClient,
  hikeId: string,
  orderedPickupStopIds: string[]
): Promise<string | null> {
  const desiredAll = await dropoffStopIdsReversedFromPickups(
    supabase,
    hikeId,
    orderedPickupStopIds
  );
  if (desiredAll.length === 0) return null;

  const { data: dropoffRows } = await supabase
    .from("stops")
    .select("id, dog_id, status, sort_order")
    .eq("hike_id", hikeId)
    .eq("stop_type", "dropoff")
    .order("sort_order");

  const dropoffs = (dropoffRows ?? []) as StopRow[];
  const completed = dropoffs.filter(
    (d) => isOpenStopStatus(d.status) && !isIncompleteStopStatus(d.status)
  );
  const completedIds = new Set(completed.map((d) => d.id));
  const remainingDesired = desiredAll.filter((id) => !completedIds.has(id));

  return applyStopReorder(supabase, hikeId, "dropoff", [
    ...completed.map((d) => d.id),
    ...remainingDesired,
  ]);
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
  return syncDropoffsPreservingCompleted(
    supabase,
    hikeId,
    orderedPickupStopIds
  );
}

/**
 * After dogs are removed from an existing day plan, keep remaining pickups in
 * their current relative order and rebuild drop-offs as the reverse.
 */
export async function compactDailyPlanAfterRemovals(
  supabase: SupabaseClient,
  hikeId: string
): Promise<string | null> {
  const { data: pickupRows } = await supabase
    .from("stops")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup")
    .order("sort_order");

  const orderedPickupStopIds = (pickupRows ?? [])
    .filter((p) => p.status !== "cancelled" && p.status !== "skipped")
    .map((p) => p.id);

  if (orderedPickupStopIds.length === 0) return null;

  return applyPickupReorderWithReverseDropoff(
    supabase,
    hikeId,
    orderedPickupStopIds
  );
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
