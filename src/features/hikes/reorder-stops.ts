import type { SupabaseClient } from "@supabase/supabase-js";

/** Two-phase update avoids unique (hike_id, stop_type, sort_order) conflicts. */
export async function applyStopReorder(
  supabase: SupabaseClient,
  hikeId: string,
  stopType: "pickup" | "dropoff",
  orderedStopIds: string[]
): Promise<string | null> {
  if (orderedStopIds.length === 0) return null;

  // Phase 1: park all rows in a high range (parallel).
  const phase1 = await Promise.all(
    orderedStopIds.map((id, i) =>
      supabase
        .from("stops")
        .update({ sort_order: 1000 + i })
        .eq("id", id)
        .eq("hike_id", hikeId)
        .eq("stop_type", stopType)
    )
  );
  for (const { error } of phase1) {
    if (error) return error.message;
  }

  // Phase 2: write final 0..n-1 order (parallel).
  const phase2 = await Promise.all(
    orderedStopIds.map((id, i) =>
      supabase
        .from("stops")
        .update({ sort_order: i })
        .eq("id", id)
        .eq("hike_id", hikeId)
        .eq("stop_type", stopType)
    )
  );
  for (const { error } of phase2) {
    if (error) return error.message;
  }

  return null;
}
