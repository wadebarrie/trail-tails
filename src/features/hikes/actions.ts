"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { getCompanyTimezone } from "@/features/company/queries";
import { getDateInTimezone } from "@/lib/dates";
import { syncStopsForDate, syncStopsForRouteDate } from "@/features/hikes/sync-stops";
import {
  applyPickupReorderWithReverseDropoff,
  resyncHikeStopSortForRoute,
} from "@/features/hikes/stop-order";
import { one } from "@/lib/supabase/relations";

function revalidateHikePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

/** Admin: regenerate hikes and stops for a date (after schedule changes). */
export async function syncHikesForDateAction(
  date: string
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date." };
  }

  try {
    await syncStopsForDate(profile.company_id, date);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Sync failed.",
    };
  }

  revalidateHikePaths();
  return { success: true };
}

/** Admin: sync today or tomorrow by offset from company timezone. */
export async function syncHikesForOffsetAction(
  offsetDays: 0 | 1
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");
  const timeZone = await getCompanyTimezone(profile.company_id);
  const date = getDateInTimezone(timeZone, offsetDays);
  return syncHikesForDateAction(date);
}

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
    return {
      error: "Drop-off order follows pickup order in reverse — reorder pickups instead.",
    };
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

/** Admin: add an as-needed dog to a specific route and date (one-day stops only). */
export async function addAsNeededDogToDayAction(
  routeId: string,
  date: string,
  dogId: string
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date." };
  }

  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!route) return { error: "Route not found." };

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, schedule_type, is_active")
    .eq("id", dogId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!dog || !dog.is_active) return { error: "Dog not found." };
  if (dog.schedule_type !== "as_needed") {
    return { error: "Only as-needed dogs can be added this way. Assign recurring dogs on the Routes page." };
  }

  const { data: existingAssignment } = await supabase
    .from("dog_day_assignments")
    .select("id, route_id")
    .eq("dog_id", dogId)
    .eq("date", date)
    .maybeSingle();

  if (existingAssignment) {
    if (existingAssignment.route_id === routeId) {
      return { success: true };
    }
    return { error: "This dog is already scheduled on another route for that day." };
  }

  const { error: insertError } = await supabase.from("dog_day_assignments").insert({
    company_id: profile.company_id,
    dog_id: dogId,
    route_id: routeId,
    date,
  });

  if (insertError) return { error: insertError.message };

  try {
    await syncStopsForRouteDate(profile.company_id, routeId, date);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create stops.",
    };
  }

  revalidateHikePaths();
  return { success: true };
}

/** Admin: update planned window for a stop on a specific day's route plan. */
export async function updateStopWindowAction(
  stopId: string,
  windowStart: string | null,
  windowEnd: string | null
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: stop } = await supabase
    .from("stops")
    .select("id, stop_type, hikes!inner ( company_id )")
    .eq("id", stopId)
    .maybeSingle();

  if (!stop) return { error: "Stop not found." };

  const hike = one(
    stop.hikes as { company_id: string } | { company_id: string }[]
  );
  if (!hike || hike.company_id !== profile.company_id) {
    return { error: "Stop not found." };
  }

  const hasStart = Boolean(windowStart?.trim());
  const hasEnd = Boolean(windowEnd?.trim());

  if (hasStart !== hasEnd) {
    return { error: "Window requires both start and end times, or neither." };
  }

  if (stop.stop_type === "pickup" && (!hasStart || !hasEnd)) {
    return { error: "Pickup stops require a planned window." };
  }

  const { error } = await supabase
    .from("stops")
    .update({
      window_start: hasStart ? windowStart : null,
      window_end: hasEnd ? windowEnd : null,
    })
    .eq("id", stopId);

  if (error) return { error: error.message };

  revalidateHikePaths();
  return { success: true };
}

/** Admin: remove an as-needed dog from a specific day's route plan only. */
export async function removeAsNeededDogFromDayAction(
  routeId: string,
  date: string,
  dogId: string
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date." };
  }

  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, schedule_type")
    .eq("id", dogId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!dog) return { error: "Dog not found." };
  if (dog.schedule_type !== "as_needed") {
    return {
      error:
        "Only as-needed dogs can be removed from a daily plan this way. Use schedule exceptions for recurring dogs.",
    };
  }

  const { data: assignment } = await supabase
    .from("dog_day_assignments")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("dog_id", dogId)
    .eq("route_id", routeId)
    .eq("date", date)
    .maybeSingle();

  if (!assignment) return { error: "Dog is not on this day's route plan." };

  const { data: hike } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId)
    .eq("date", date)
    .maybeSingle();

  if (hike) {
    await supabase.from("stops").delete().eq("hike_id", hike.id).eq("dog_id", dogId);
  }

  const { error } = await supabase
    .from("dog_day_assignments")
    .delete()
    .eq("id", assignment.id);

  if (error) return { error: error.message };

  revalidateHikePaths();
  return { success: true };
}
