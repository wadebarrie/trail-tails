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

  const sorted = dogs ?? [];
  const pickupCount = sorted.length;
  const indexByDogId = new Map(sorted.map((dog, index) => [dog.id, index]));

  for (const dog of sorted) {
    const pickupIndex = indexByDogId.get(dog.id) ?? 0;

    const { error: pickupError } = await supabase
      .from("stops")
      .update({ sort_order: pickupIndex })
      .eq("hike_id", hikeId)
      .eq("dog_id", dog.id)
      .eq("stop_type", "pickup");

    if (pickupError) return pickupError.message;

    const { error: dropoffError } = await supabase
      .from("stops")
      .update({
        sort_order: dropoffSortOrderFromPickupIndex(pickupIndex, pickupCount),
      })
      .eq("hike_id", hikeId)
      .eq("dog_id", dog.id)
      .eq("stop_type", "dropoff");

    if (dropoffError) return dropoffError.message;
  }

  return null;
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
