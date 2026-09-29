"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { parseRouteCadence } from "@/features/company/route-cadence";
import { getDateInTimezone, parseScheduleDays } from "@/lib/dates";
import { syncStopsForDate, syncStopsForRouteDate } from "@/features/hikes/sync-stops";
import type { HikePeriod } from "@/features/hikes/hike-period";

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  schedule_days: z.string().min(1, "Select at least one day"),
  period: z.enum(["morning", "afternoon"]).default("morning"),
});

async function resolveRoutePeriod(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  requested: HikePeriod
): Promise<HikePeriod> {
  const { data } = await supabase
    .from("companies")
    .select("route_cadence")
    .eq("id", companyId)
    .maybeSingle();
  return parseRouteCadence(data?.route_cadence) === "once" ? "morning" : requested;
}

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
  const period = await resolveRoutePeriod(
    supabase,
    profile.company_id,
    parsed.data.period
  );

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
      period,
      sort_order: (lastRoute?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !route) {
    return { error: error?.message ?? "Failed to create route" };
  }

  try {
    await saveRouteScheduleDays(supabase, route.id, days);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save schedule",
    };
  }

  const requestedDogIds = [
    ...new Set(
      formData
        .getAll("dog_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];

  if (requestedDogIds.length > 0) {
    const { data: assignableDogs, error: dogsError } = await supabase
      .from("dogs")
      .select("id, route_id")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .eq("schedule_type", "recurring")
      .in("id", requestedDogIds);

    if (dogsError) {
      return { error: dogsError.message };
    }

    const byId = new Map((assignableDogs ?? []).map((dog) => [dog.id, dog]));
    const ordered = requestedDogIds.filter((id) => byId.has(id));
    const previousRouteIds = ordered
      .map((id) => byId.get(id)?.route_id)
      .filter((id): id is string => Boolean(id));

    for (let index = 0; index < ordered.length; index++) {
      const { error: assignError } = await supabase
        .from("dogs")
        .update({
          route_id: route.id,
          route_sort_order: index,
        })
        .eq("id", ordered[index])
        .eq("company_id", profile.company_id);

      if (assignError) {
        return { error: assignError.message };
      }
    }

    await syncAffectedRoutes(profile.company_id, [
      ...previousRouteIds,
      route.id,
    ]);
    revalidateRouteDogPaths();
  }

  await revalidateRoutesAndSync(supabase, profile.company_id);
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
  const period = await resolveRoutePeriod(
    supabase,
    profile.company_id,
    parsed.data.period
  );

  const { error } = await supabase
    .from("routes")
    .update({
      name: parsed.data.name.trim(),
      period,
    })
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .eq("is_active", true);

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

  const uniqueRouteIds = [...new Set(routeIds.filter(Boolean) as string[])];
  await Promise.all(
    uniqueRouteIds.flatMap((routeId) => [
      syncStopsForRouteDate(companyId, routeId, today),
      syncStopsForRouteDate(companyId, routeId, tomorrow),
    ])
  );
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
    .eq("is_active", true)
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
        "Only-when-booked dogs are added from the Today or Tomorrow pages, not assigned to a route permanently.",
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

export async function deleteRouteAction(routeId: string) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("id, name")
    .eq("id", routeId)
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!route) return { error: "Route not found" };

  const { error: unassignError } = await supabase
    .from("dogs")
    .update({ route_id: null })
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId);

  if (unassignError) return { error: unassignError.message };

  const { error: assignmentError } = await supabase
    .from("dog_day_assignments")
    .delete()
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId);

  if (assignmentError) return { error: assignmentError.message };

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", profile.company_id)
    .single();

  const tz = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezone(tz, 0);

  const { data: upcomingHikes } = await supabase
    .from("hikes")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId)
    .gte("date", today);

  const hikeIds = (upcomingHikes ?? []).map((h) => h.id);
  if (hikeIds.length > 0) {
    const { error: cancelError } = await supabase
      .from("stops")
      .update({ status: "cancelled" })
      .in("hike_id", hikeIds)
      .eq("status", "scheduled");

    if (cancelError) return { error: cancelError.message };
  }

  const { error } = await supabase
    .from("routes")
    .update({ is_active: false })
    .eq("id", routeId)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  try {
    await revalidateRoutesAndSync(supabase, profile.company_id);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Route deleted but sync failed",
    };
  }

  revalidatePath("/dashboard/dogs");
  return { success: true };
}

export async function assignRouteVehicleAction(
  routeId: string,
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
    .from("routes")
    .update({ default_vehicle_id: vehicleId })
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
    .update({ vehicle_id: vehicleId })
    .eq("company_id", profile.company_id)
    .eq("route_id", routeId)
    .in("date", [today, tomorrow]);

  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");

  return { success: true };
}
