import type { SupabaseClient } from "@supabase/supabase-js";

/** Two-phase update avoids unique (hike_id, stop_type, sort_order) conflicts. */
export async function applyStopReorder(
  supabase: SupabaseClient,
  hikeId: string,
  stopType: "pickup" | "dropoff",
  orderedStopIds: string[]
): Promise<string | null> {
  for (let i = 0; i < orderedStopIds.length; i++) {
    const { error } = await supabase
      .from("stops")
      .update({ sort_order: 1000 + i })
      .eq("id", orderedStopIds[i])
      .eq("hike_id", hikeId)
      .eq("stop_type", stopType);
    if (error) return error.message;
  }

  for (let i = 0; i < orderedStopIds.length; i++) {
    const { error } = await supabase
      .from("stops")
      .update({ sort_order: i })
      .eq("id", orderedStopIds[i])
      .eq("hike_id", hikeId)
      .eq("stop_type", stopType);
    if (error) return error.message;
  }

  return null;
}
