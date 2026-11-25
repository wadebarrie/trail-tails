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
import { BULK_GALLERY_SMS_BUDGET_MS } from "@/features/hike-photos/gallery-sms-rules";
import { sendGallerySmsForHikeIds } from "@/features/hike-photos/send-gallery-sms";
import { one } from "@/lib/supabase/relations";

function revalidateHikePaths(options?: { includeDashboard?: boolean }) {
  if (options?.includeDashboard !== false) {
    revalidatePath("/dashboard");
  }
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

/** Lightweight revalidation for small day-plan edits (add dog, window tweak). */
function revalidateHikeDayPaths() {
  revalidateHikePaths({ includeDashboard: false });
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
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return { success: true };
}

export async function assignVehicleAction(
  hikeId: string,
  vehicleId: string | null
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!vehicle) return { error: "Vehicle not found in your company." };
  }

  const { error } = await supabase
    .from("hikes")
    .update({ vehicle_id: vehicleId })
    .eq("id", hikeId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
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

const OPEN_STOP_STATUSES = ["scheduled", "en_route", "arrived"] as const;
const HIKE_ID_CHUNK = 80;

function revalidateCloseOutPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/hike-report");
  revalidatePath("/dashboard/photos");
  revalidatePath("/dashboard/sms");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

/**
 * Mark open stops picked up / dropped off and the hikes completed.
 * Two updates per chunk, not one round trip per stop.
 */
async function closeOutHikes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hikeIds: string[],
  companyId: string
): Promise<{ closed: number; error?: string }> {
  const now = new Date().toISOString();
  let closed = 0;
  for (let i = 0; i < hikeIds.length; i += HIKE_ID_CHUNK) {
    const chunk = hikeIds.slice(i, i + HIKE_ID_CHUNK);
    const [pickups, dropoffs] = await Promise.all([
      supabase
        .from("stops")
        .update({ status: "picked_up", completed_at: now })
        .in("hike_id", chunk)
        .eq("stop_type", "pickup")
        .in("status", [...OPEN_STOP_STATUSES]),
      supabase
        .from("stops")
        .update({ status: "dropped_off", completed_at: now })
        .in("hike_id", chunk)
        .eq("stop_type", "dropoff")
        .in("status", [...OPEN_STOP_STATUSES]),
    ]);
    if (pickups.error) return { closed, error: pickups.error.message };
    if (dropoffs.error) return { closed, error: dropoffs.error.message };

    const { error } = await supabase
      .from("hikes")
      .update({ status: "completed" })
      .in("id", chunk)
      .eq("company_id", companyId)
      .neq("status", "completed");
    if (error) return { closed, error: error.message };
    closed += chunk.length;
  }
  return { closed };
}

/** Admin: close out a hike — finishes open stops and marks the hike completed. */
export async function completeHikeAction(
  hikeId: string
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id, status")
    .eq("id", hikeId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!hike) return { error: "Hike not found." };
  if (hike.status === "completed") return { success: true };

  const closed = await closeOutHikes(supabase, [hikeId], profile.company_id);
  if (closed.error) return { error: closed.error };

  revalidateCloseOutPaths();
  return { success: true };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Admin: close out every incomplete hike in a date range (past days included).
 * Open stops become picked up / dropped off — same as per-hike Close out.
 */
export async function bulkCloseOutHikesInRangeAction(
  start: string,
  end: string
): Promise<{
  success?: true;
  closed?: number;
  gallerySent?: number;
  galleryDeferred?: number;
  error?: string;
}> {
  const profile = await requireRole("admin");
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return { error: "Choose a valid date range." };
  }
  if (end < start) {
    return { error: "End date must be on or after the start date." };
  }

  const supabase = await createClient();
  const { data: hikes, error } = await supabase
    .from("hikes")
    .select("id, status")
    .eq("company_id", profile.company_id)
    .gte("date", start)
    .lte("date", end)
    .neq("status", "completed");

  if (error) return { error: error.message };

  const closedIds = (hikes ?? []).map((hike) => hike.id as string);
  const closed = await closeOutHikes(supabase, closedIds, profile.company_id);
  if (closed.error) {
    revalidateCloseOutPaths();
    return { error: closed.error, closed: closed.closed };
  }

  const galleries = await sendGallerySmsForHikeIds(closedIds, {
    force: false,
    deadlineMs: Date.now() + BULK_GALLERY_SMS_BUDGET_MS,
  }).catch(() => ({
    sent: 0,
    skipped: 0,
    errors: 0,
    deferred: closedIds.length,
  }));

  revalidateCloseOutPaths();
  return {
    success: true,
    closed: closed.closed,
    gallerySent: galleries.sent,
    galleryDeferred: galleries.deferred,
  };
}

export async function bulkCloseOutHikesFormAction(
  _prev: {
    success?: true;
    closed?: number;
    gallerySent?: number;
    galleryDeferred?: number;
    error?: string;
  } | null,
  formData: FormData
): Promise<{
  success?: true;
  closed?: number;
  gallerySent?: number;
  galleryDeferred?: number;
  error?: string;
}> {
  return bulkCloseOutHikesInRangeAction(
    String(formData.get("start") ?? ""),
    String(formData.get("end") ?? "")
  );
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

/** Admin: add an as-needed dog to a specific route and date. */
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
    .select("id, period")
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
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
    return {
      error:
        "Only dogs set to Only when booked can be added this way. Assign every-week dogs on the Routes page.",
    };
  }

  const { data: existingAssignment } = await supabase
    .from("dog_day_assignments")
    .select("id, route_id")
    .eq("dog_id", dogId)
    .eq("date", date)
    .eq("period", route.period)
    .maybeSingle();

  if (existingAssignment) {
    if (existingAssignment.route_id === routeId) {
      return { success: true };
    }
    return {
      error: `This dog is already scheduled on another ${route.period} route for that day.`,
    };
  }

  const { error: insertError } = await supabase.from("dog_day_assignments").insert({
    company_id: profile.company_id,
    dog_id: dogId,
    route_id: routeId,
    date,
    period: route.period,
  });

  if (insertError) return { error: insertError.message };

  try {
    await syncStopsForRouteDate(profile.company_id, routeId, date);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create stops.",
    };
  }

  revalidateHikeDayPaths();
  return { success: true };
}

/** Admin: update planned window for a stop on a specific day's route plan. */
export async function updateStopWindowAction(
  stopId: string,
  windowStart: string | null,
  windowEnd: string | null,
  options?: { saveAsDogDefault?: boolean }
): Promise<{ success?: true; error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: stop } = await supabase
    .from("stops")
    .select("id, stop_type, dog_id, hikes!inner ( company_id )")
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

  if (
    options?.saveAsDogDefault &&
    stop.stop_type === "pickup" &&
    hasStart &&
    hasEnd &&
    stop.dog_id
  ) {
    const { error: dogError } = await supabase
      .from("dogs")
      .update({
        pickup_window_start: windowStart,
        pickup_window_end: windowEnd,
      })
      .eq("id", stop.dog_id)
      .eq("company_id", profile.company_id);

    if (dogError) return { error: dogError.message };

    revalidatePath("/dashboard/dogs");
    revalidatePath(`/dashboard/dogs/${stop.dog_id}`);
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/route");
  }

  revalidateHikeDayPaths();
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

  const { data: route } = await supabase
    .from("routes")
    .select("period")
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!route) return { error: "Route not found." };

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
        "Only dogs set to Only when booked can be removed from a daily plan this way. Use schedule exceptions for every-week dogs.",
    };
  }

  const { data: assignment } = await supabase
    .from("dog_day_assignments")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("dog_id", dogId)
    .eq("route_id", routeId)
    .eq("date", date)
    .eq("period", route.period)
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

  revalidateHikeDayPaths();
  return { success: true };
}
