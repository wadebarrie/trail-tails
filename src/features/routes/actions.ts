"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { getDateInTimezone, parseScheduleDays } from "@/lib/dates";
import { syncStopsForDate, syncStopsForRouteDate } from "@/features/hikes/sync-stops";

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  schedule_days: z.string().min(1, "Select at least one day"),
});

async function saveRouteScheduleDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  routeId: string,
  days: number[]
) {
  await supabase.from("route_schedule_days").delete().eq("route_id", routeId);

  if (days.length > 0) {
    const { error } = await supabase.from("route_schedule_days").insert(
      days.map((day_of_week) => ({ route_id: routeId, day_of_week }))
    );
    if (error) throw new Error(error.message);
  }
}

async function revalidateRoutesAndSync(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
) {
  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const tz = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(tz, 0);
  const tomorrow = getDateInTimezone(tz, 1);

  await syncStopsForDate(companyId, today);
  await syncStopsForDate(companyId, tomorrow);

  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

export async function createRouteAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = routeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const days = parseScheduleDays(parsed.data.schedule_days);
  if (days.length === 0) {
    return { error: "Select at least one day" };
  }

  const supabase = await createClient();

  const { data: lastRoute } = await supabase
    .from("routes")
    .select("sort_order")
    .eq("company_id", profile.company_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: route, error } = await supabase
    .from("routes")
    .insert({
      company_id: profile.company_id,
      name: parsed.data.name.trim(),
      sort_order: (lastRoute?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !route) {
    return { error: error?.message ?? "Failed to create route" };
  }

  try {
    await saveRouteScheduleDays(supabase, route.id, days);
    await revalidateRoutesAndSync(supabase, profile.company_id);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save schedule",
    };
  }

  return { ok: true };
}

export async function updateRouteAction(
  routeId: string,
  _prev: { error?: string; ok?: boolean },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = routeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const days = parseScheduleDays(parsed.data.schedule_days);
  if (days.length === 0) {
    return { error: "Select at least one day" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("routes")
    .update({ name: parsed.data.name.trim() })
    .eq("id", routeId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  try {
    await saveRouteScheduleDays(supabase, routeId, days);
    await revalidateRoutesAndSync(supabase, profile.company_id);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save schedule",
    };
  }

  return { ok: true };
}

async function syncAffectedRoutes(
  companyId: string,
  routeIds: (string | null | undefined)[]
) {
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  const tz = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(tz, 0);
  const tomorrow = getDateInTimezone(tz, 1);

  for (const routeId of new Set(routeIds.filter(Boolean) as string[])) {
    await syncStopsForRouteDate(companyId, routeId, today);
    await syncStopsForRouteDate(companyId, routeId, tomorrow);
  }
}

function revalidateRouteDogPaths() {
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/dogs");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

export async function addDogToRouteAction(routeId: string, dogId: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!route) return { error: "Route not found" };

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, route_id, schedule_type")
    .eq("id", dogId)
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!dog) return { error: "Dog not found" };
  if (dog.schedule_type === "as_needed") {
    return {
      error:
        "As-needed dogs are added from the Today or Tomorrow pages, not assigned to a route permanently.",
    };
  }
  if (dog.route_id === routeId) return { success: true };

  const previousRouteId = dog.route_id;

  const { count } = await supabase
    .from("dogs")
    .select("*", { count: "exact", head: true })
    .eq("route_id", routeId);

  const { error } = await supabase
    .from("dogs")
    .update({
      route_id: routeId,
      route_sort_order: count ?? 0,
    })
    .eq("id", dogId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  await syncAffectedRoutes(profile.company_id, [previousRouteId, routeId]);
  revalidateRouteDogPaths();

  return { success: true };
}

export async function removeDogFromRouteAction(routeId: string, dogId: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("id, route_id")
    .eq("id", dogId)
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId)
    .maybeSingle();

  if (!dog) return { error: "Dog is not on this route" };

  const { error } = await supabase
    .from("dogs")
    .update({ route_id: null })
    .eq("id", dogId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  await syncAffectedRoutes(profile.company_id, [routeId]);
  revalidateRouteDogPaths();

  return { success: true };
}

export async function assignRouteDriverAction(
  routeId: string,
  driverId: string | null
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("routes")
    .update({ default_driver_id: driverId })
    .eq("id", routeId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", profile.company_id)
    .single();

  const tz = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(tz, 0);
  const tomorrow = getDateInTimezone(tz, 1);

  await supabase
    .from("hikes")
    .update({ driver_id: driverId })
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId)
    .in("date", [today, tomorrow]);

  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");

  return { success: true };
}
