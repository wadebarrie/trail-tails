"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { applyStopReorder } from "@/features/hikes/reorder-stops";
import {
  applyPickupReorderWithReverseDropoff,
  resyncHikeStopSortForRoute,
} from "@/features/hikes/stop-order";

export async function assignDriverAction(hikeId: string, driverId: string | null) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("hikes")
    .update({ driver_id: driverId })
    .eq("id", hikeId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  return { success: true };
}

export async function reorderStopsAction(
  hikeId: string,
  stopType: "pickup" | "dropoff",
  orderedStopIds: string[]
) {
  await requireRole("admin");

  const supabase = await createClient();

  if (stopType === "pickup") {
    const error = await applyPickupReorderWithReverseDropoff(
      supabase,
      hikeId,
      orderedStopIds
    );
    if (error) return { error };
  } else {
    const error = await applyStopReorder(
      supabase,
      hikeId,
      stopType,
      orderedStopIds
    );
    if (error) return { error };
  }

  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return { success: true };
}

const TERMINAL_STOP_STATUSES = new Set([
  "picked_up",
  "dropped_off",
  "skipped",
  "cancelled",
]);

/** Admin: close out a hike — finishes open stops and marks the hike completed. */
export async function completeHikeAction(
  hikeId: string
): Promise<{ success?: true; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id, status, date")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike) return { error: "Hike not found." };
  if (hike.status === "completed") return { success: true };

  const now = new Date().toISOString();
  const { data: stops } = await supabase
    .from("stops")
    .select("id, stop_type, status")
    .eq("hike_id", hikeId);

  for (const stop of stops ?? []) {
    if (TERMINAL_STOP_STATUSES.has(stop.status)) continue;

    const status = stop.stop_type === "pickup" ? "picked_up" : "dropped_off";
    const { error } = await supabase
      .from("stops")
      .update({ status, completed_at: now })
      .eq("id", stop.id);

    if (error) return { error: error.message };
  }

  const { error: hikeError } = await supabase
    .from("hikes")
    .update({ status: "completed" })
    .eq("id", hikeId);

  if (hikeError) return { error: hikeError.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/dashboard/billing");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return { success: true };
}

export async function reorderRouteDogsAction(
  routeId: string,
  orderedDogIds: string[]
): Promise<{ error?: string; success?: true }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  for (let i = 0; i < orderedDogIds.length; i++) {
    const { error } = await supabase
      .from("dogs")
      .update({ route_sort_order: 1000 + i })
      .eq("id", orderedDogIds[i])
      .eq("company_id", profile.company_id)
      .eq("route_id", routeId);
    if (error) return { error: error.message };
  }

  for (let i = 0; i < orderedDogIds.length; i++) {
    const { error } = await supabase
      .from("dogs")
      .update({ route_sort_order: i })
      .eq("id", orderedDogIds[i])
      .eq("company_id", profile.company_id)
      .eq("route_id", routeId);
    if (error) return { error: error.message };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", profile.company_id)
    .single();

  await resyncHikeStopSortForRoute(
    supabase,
    profile.company_id,
    routeId,
    company?.timezone ?? "America/Los_Angeles"
  );

  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return { success: true };
}

/** @deprecated Use reorderRouteDogsAction */
export async function reorderDefaultRouteAction(orderedDogIds: string[]) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("company_id", profile.company_id)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (!route) return { error: "No routes configured" };
  return reorderRouteDogsAction(route.id, orderedDogIds);
}
