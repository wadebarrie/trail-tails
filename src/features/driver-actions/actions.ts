"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireDriverAccess } from "@/features/auth/queries";
import {
  scheduleArrivedNotification,
  scheduleDropoffSideEffects,
  scheduleEnRouteSideEffects,
  schedulePickupNotification,
} from "@/features/driver-actions/driver-action-side-effects";
import { applyPickupReorderWithReverseDropoff } from "@/features/hikes/stop-order";
import { PerfTimer } from "@/lib/perf";
import { one } from "@/lib/supabase/relations";
import type { StopStatus } from "@/types";

export type DriverStopActionResult =
  | { success: true; status: StopStatus; alreadyDone?: boolean }
  | { error: string };

type StopContext = {
  id: string;
  hike_id: string;
  dog_id: string;
  stop_type: string;
  status: StopStatus;
  dogs: {
    name: string;
    company_id: string;
    customer_id: string;
    customers:
      | { owner_name: string; address_lat: number | null; address_lng: number | null }
      | { owner_name: string; address_lat: number | null; address_lng: number | null }[];
  } | {
    name: string;
    company_id: string;
    customer_id: string;
    customers:
      | { owner_name: string; address_lat: number | null; address_lng: number | null }
      | { owner_name: string; address_lat: number | null; address_lng: number | null }[];
  }[];
};

async function loadStop(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stopId: string
): Promise<StopContext | null> {
  const { data } = await supabase
    .from("stops")
    .select(
      `
      id,
      hike_id,
      dog_id,
      stop_type,
      status,
      dogs (
        name,
        company_id,
        customer_id,
        customers ( owner_name, address_lat, address_lng )
      )
    `
    )
    .eq("id", stopId)
    .maybeSingle();

  return data as StopContext | null;
}

/** Optimistic status transition — returns true only when exactly one row updated. */
async function transitionStopStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stopId: string,
  fromStatus: StopStatus,
  patch: Record<string, unknown>,
): Promise<{ transitioned: true } | { transitioned: false; error?: string }> {
  const { data, error } = await supabase
    .from("stops")
    .update(patch)
    .eq("id", stopId)
    .eq("status", fromStatus)
    .select("id")
    .maybeSingle();

  if (error) return { transitioned: false, error: error.message };
  if (!data) return { transitioned: false };
  return { transitioned: true };
}

export async function enRouteAction(
  stopId: string,
  lat: number | null,
  lng: number | null
): Promise<DriverStopActionResult> {
  const timer = new PerfTimer("driver-action en-route");
  await requireDriverAccess();
  timer.mark("auth");

  const supabase = await createClient();
  const stop = await loadStop(supabase, stopId);
  timer.mark("loadStop");
  if (!stop) return { error: "Stop not found." };

  if (
    stop.status === "en_route" ||
    stop.status === "arrived" ||
    stop.status === "picked_up" ||
    stop.status === "dropped_off"
  ) {
    timer.end("already done");
    return { success: true, status: stop.status, alreadyDone: true };
  }

  const dog = one(stop.dogs);
  const customer = one(dog?.customers);
  const origin = lat != null && lng != null ? { lat, lng } : null;
  const destination =
    customer?.address_lat != null && customer?.address_lng != null
      ? { lat: customer.address_lat, lng: customer.address_lng }
      : null;

  const transition = await transitionStopStatus(supabase, stopId, "scheduled", {
    status: "en_route",
    en_route_at: new Date().toISOString(),
    driver_lat: lat,
    driver_lng: lng,
    eta_minutes: null,
  });

  if (!transition.transitioned) {
    if ("error" in transition && transition.error) {
      return { error: transition.error };
    }
    timer.end("race — already updated");
    return { success: true, status: "en_route", alreadyDone: true };
  }
  timer.mark("db-update");

  void supabase
    .from("hikes")
    .update({ status: "in_progress" })
    .eq("id", stop.hike_id)
    .eq("status", "planned");

  if (dog) {
    scheduleEnRouteSideEffects({
      stopId,
      hikeId: stop.hike_id,
      dogId: stop.dog_id,
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogName: dog.name,
      stopType: stop.stop_type as "pickup" | "dropoff",
      origin,
      destination,
    });
  }
  timer.end();

  return { success: true, status: "en_route" };
}

export async function arrivedAction(
  stopId: string,
  lat: number | null = null,
  lng: number | null = null
): Promise<DriverStopActionResult> {
  const timer = new PerfTimer("driver-action arrived");
  await requireDriverAccess();
  timer.mark("auth");

  const supabase = await createClient();
  const stop = await loadStop(supabase, stopId);
  timer.mark("loadStop");
  if (!stop) return { error: "Stop not found." };

  if (
    stop.status === "picked_up" ||
    stop.status === "dropped_off" ||
    stop.status === "arrived"
  ) {
    timer.end("already done");
    return { success: true, status: stop.status, alreadyDone: true };
  }

  if (stop.status !== "en_route") {
    return { error: "Mark en route before arriving." };
  }

  const transition = await transitionStopStatus(supabase, stopId, "en_route", {
    status: "arrived",
    arrived_at: new Date().toISOString(),
    ...(lat != null && lng != null
      ? { driver_lat: lat, driver_lng: lng }
      : {}),
  });

  if (!transition.transitioned) {
    if ("error" in transition && transition.error) {
      return { error: transition.error };
    }
    timer.end("race — already updated");
    return { success: true, status: "arrived", alreadyDone: true };
  }
  timer.mark("db-update");

  const dog = one(stop.dogs);
  if (dog) {
    scheduleArrivedNotification({
      stopId,
      dogId: stop.dog_id,
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogName: dog.name,
      stopType: stop.stop_type as "pickup" | "dropoff",
    });
  }
  timer.end();

  return { success: true, status: "arrived" };
}

export async function completePickupAction(
  stopId: string
): Promise<DriverStopActionResult> {
  const timer = new PerfTimer("driver-action picked-up");
  await requireDriverAccess();
  timer.mark("auth");

  const supabase = await createClient();
  const stop = await loadStop(supabase, stopId);
  timer.mark("loadStop");
  if (!stop) return { error: "Stop not found." };
  if (stop.stop_type !== "pickup") return { error: "Not a pickup stop." };

  if (stop.status === "picked_up") {
    timer.end("already done");
    return { success: true, status: "picked_up", alreadyDone: true };
  }

  if (stop.status !== "arrived") {
    return { error: "Mark arrived before picking up." };
  }

  const transition = await transitionStopStatus(supabase, stopId, "arrived", {
    status: "picked_up",
    completed_at: new Date().toISOString(),
  });

  if (!transition.transitioned) {
    if ("error" in transition && transition.error) {
      return { error: transition.error };
    }
    timer.end("race — already updated");
    return { success: true, status: "picked_up", alreadyDone: true };
  }
  timer.mark("db-update");

  const dog = one(stop.dogs);
  if (dog) {
    schedulePickupNotification({
      stopId,
      dogId: stop.dog_id,
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogName: dog.name,
    });
  }
  timer.end();

  return { success: true, status: "picked_up" };
}

export async function completeDropoffAction(
  stopId: string
): Promise<DriverStopActionResult> {
  const timer = new PerfTimer("driver-action dropped-off");
  await requireDriverAccess();
  timer.mark("auth");

  const supabase = await createClient();
  const stop = await loadStop(supabase, stopId);
  timer.mark("loadStop");
  if (!stop) return { error: "Stop not found." };
  if (stop.stop_type !== "dropoff") return { error: "Not a drop-off stop." };

  if (stop.status === "dropped_off") {
    timer.end("already done");
    return { success: true, status: "dropped_off", alreadyDone: true };
  }

  if (stop.status !== "arrived") {
    return { error: "Mark arrived before dropping off." };
  }

  const transition = await transitionStopStatus(supabase, stopId, "arrived", {
    status: "dropped_off",
    completed_at: new Date().toISOString(),
  });

  if (!transition.transitioned) {
    if ("error" in transition && transition.error) {
      return { error: transition.error };
    }
    timer.end("race — already updated");
    return { success: true, status: "dropped_off", alreadyDone: true };
  }
  timer.mark("db-update");

  const dog = one(stop.dogs);
  if (dog) {
    scheduleDropoffSideEffects({
      stopId,
      hikeId: stop.hike_id,
      dogId: stop.dog_id,
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogName: dog.name,
    });
  }
  timer.end();

  return { success: true, status: "dropped_off" };
}

/** Reorder today's pickup route before any stops begin. Syncs drop-off order to match. */
export async function reorderDriverPickupsAction(
  hikeId: string,
  orderedPickupStopIds: string[]
) {
  await requireDriverAccess();
  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike) return { error: "Hike not found." };

  const { data: pickups } = await supabase
    .from("stops")
    .select("id, status")
    .eq("hike_id", hikeId)
    .eq("stop_type", "pickup");

  const pickupRows = pickups ?? [];
  if (pickupRows.length !== orderedPickupStopIds.length) {
    return { error: "Invalid pickup order." };
  }

  const pickupIds = new Set(pickupRows.map((p) => p.id));
  if (!orderedPickupStopIds.every((id) => pickupIds.has(id))) {
    return { error: "Invalid pickup order." };
  }

  if (pickupRows.some((p) => p.status !== "scheduled")) {
    return { error: "Pickup order can only be changed before the route starts." };
  }

  const error = await applyPickupReorderWithReverseDropoff(
    supabase,
    hikeId,
    orderedPickupStopIds
  );
  if (error) return { error };

  revalidatePath("/today");
  revalidatePath("/dashboard/hikes/today");
  return { success: true };
}
