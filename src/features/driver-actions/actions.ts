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
import {
  applyMidRouteDropoffReorder,
  applyMidRoutePickupReorder,
} from "@/features/hikes/stop-order";
import { geocodeAddress, isGeocodingConfigured } from "@/lib/google-maps/geocode";
import type { LatLng } from "@/lib/google-maps/eta";
import { logWarn } from "@/lib/logger";
import { PerfTimer } from "@/lib/perf";
import { one } from "@/lib/supabase/relations";
import type { StopStatus } from "@/types";

export type DriverStopActionResult =
  | { success: true; status: StopStatus; alreadyDone?: boolean }
  | { error: string };

type CustomerCoords = {
  owner_name: string;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
};

type StopContext = {
  id: string;
  hike_id: string;
  dog_id: string;
  stop_type: string;
  status: StopStatus;
  sort_order: number;
  dogs:
    | {
        name: string;
        company_id: string;
        customer_id: string;
        customers: CustomerCoords | CustomerCoords[];
      }
    | {
        name: string;
        company_id: string;
        customer_id: string;
        customers: CustomerCoords | CustomerCoords[];
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
      sort_order,
      dogs (
        name,
        company_id,
        customer_id,
        customers ( owner_name, address, address_lat, address_lng )
      )
    `
    )
    .eq("id", stopId)
    .maybeSingle();

  return data as StopContext | null;
}

/** Prefer live GPS; else last known driver coords on this hike; else prior stop address. */
async function resolveEnRouteOrigin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hikeId: string,
  stopId: string,
  sortOrder: number,
  stopType: string,
  lat: number | null,
  lng: number | null
): Promise<LatLng | null> {
  if (lat != null && lng != null) {
    return { lat, lng };
  }

  const { data: priorGps } = await supabase
    .from("stops")
    .select("driver_lat, driver_lng, en_route_at")
    .eq("hike_id", hikeId)
    .neq("id", stopId)
    .not("driver_lat", "is", null)
    .not("driver_lng", "is", null)
    .order("en_route_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (priorGps?.driver_lat != null && priorGps?.driver_lng != null) {
    return { lat: priorGps.driver_lat, lng: priorGps.driver_lng };
  }

  const { data: priorStop } = await supabase
    .from("stops")
    .select(
      `
      id,
      dogs (
        customers ( address_lat, address_lng )
      )
    `
    )
    .eq("hike_id", hikeId)
    .eq("stop_type", stopType)
    .lt("sort_order", sortOrder)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorDog = one(
    priorStop?.dogs as
      | {
          customers:
            | { address_lat: number | null; address_lng: number | null }
            | { address_lat: number | null; address_lng: number | null }[];
        }
      | {
          customers:
            | { address_lat: number | null; address_lng: number | null }
            | { address_lat: number | null; address_lng: number | null }[];
        }[]
      | null
      | undefined
  );
  const priorCustomer = one(priorDog?.customers);
  if (
    priorCustomer?.address_lat != null &&
    priorCustomer?.address_lng != null
  ) {
    return {
      lat: priorCustomer.address_lat,
      lng: priorCustomer.address_lng,
    };
  }

  return null;
}

/** Use stored customer coords; geocode once if missing so ETA SMS can still go out. */
async function resolveEnRouteDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  customer: CustomerCoords | null | undefined
): Promise<LatLng | null> {
  if (customer?.address_lat != null && customer?.address_lng != null) {
    return { lat: customer.address_lat, lng: customer.address_lng };
  }

  const address = customer?.address?.trim();
  if (!address || !isGeocodingConfigured()) {
    return null;
  }

  const geocoded = await geocodeAddress(address);
  if (!geocoded.ok) {
    logWarn("eta", "En Route destination geocode failed", {
      context: { customerId, error: geocoded.error },
    });
    return null;
  }

  await supabase
    .from("customers")
    .update({
      address_lat: geocoded.result.lat,
      address_lng: geocoded.result.lng,
    })
    .eq("id", customerId);

  return { lat: geocoded.result.lat, lng: geocoded.result.lng };
}

/** Optimistic status transition — returns true only when exactly one row updated. */
async function transitionStopStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stopId: string,
  fromStatus: StopStatus,
  patch: Record<string, unknown>
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
  const [origin, destination] = await Promise.all([
    resolveEnRouteOrigin(
      supabase,
      stop.hike_id,
      stop.id,
      stop.sort_order,
      stop.stop_type,
      lat,
      lng
    ),
    dog
      ? resolveEnRouteDestination(supabase, dog.customer_id, customer)
      : Promise.resolve(null),
  ]);
  timer.mark("resolve-coords");

  const driverLat = lat ?? origin?.lat ?? null;
  const driverLng = lng ?? origin?.lng ?? null;

  const transition = await transitionStopStatus(supabase, stopId, "scheduled", {
    status: "en_route",
    en_route_at: new Date().toISOString(),
    driver_lat: driverLat,
    driver_lng: driverLng,
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
    if (!origin || !destination) {
      logWarn("eta", "En Route SMS may omit ETA — missing coordinates", {
        context: {
          stopId,
          hasOrigin: Boolean(origin),
          hasDestination: Boolean(destination),
        },
      });
    }

    await scheduleEnRouteSideEffects({
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
  lng: number | null
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
    await scheduleArrivedNotification({
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
    await schedulePickupNotification({
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
    await scheduleDropoffSideEffects({
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

/** Reorder remaining pickups mid-route. Completed stops stay fixed at the front. */
export async function reorderDriverPickupsAction(
  hikeId: string,
  orderedIncompletePickupIds: string[]
) {
  await requireDriverAccess();
  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike) return { error: "Hike not found." };

  const error = await applyMidRoutePickupReorder(
    supabase,
    hikeId,
    orderedIncompletePickupIds
  );
  if (error) return { error };

  revalidatePath("/today");
  revalidatePath("/dashboard/hikes/today");
  return { success: true };
}

/** Reorder remaining drop-offs mid-route. Completed drop-offs stay fixed at the front. */
export async function reorderDriverDropoffsAction(
  hikeId: string,
  orderedIncompleteDropoffIds: string[]
) {
  await requireDriverAccess();
  const supabase = await createClient();

  const { data: hike } = await supabase
    .from("hikes")
    .select("id")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike) return { error: "Hike not found." };

  const error = await applyMidRouteDropoffReorder(
    supabase,
    hikeId,
    orderedIncompleteDropoffIds
  );
  if (error) return { error };

  revalidatePath("/today");
  revalidatePath("/dashboard/hikes/today");
  return { success: true };
}
