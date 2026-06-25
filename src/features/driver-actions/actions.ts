"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import {
  buildArrivedMessage,
  buildDroppedOffMessage,
  buildEnRouteMessage,
  buildPickedUpMessage,
  logNotification,
} from "@/features/notifications/log";
import { one } from "@/lib/supabase/relations";
import type { StopStatus } from "@/types";

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
    customers: { owner_name: string } | { owner_name: string }[];
  } | {
    name: string;
    company_id: string;
    customer_id: string;
    customers: { owner_name: string } | { owner_name: string }[];
  }[];
};

async function loadStop(stopId: string): Promise<StopContext | null> {
  const supabase = await createClient();
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
        customers ( owner_name )
      )
    `
    )
    .eq("id", stopId)
    .maybeSingle();

  return data as StopContext | null;
}

export async function enRouteAction(
  stopId: string,
  lat: number | null,
  lng: number | null
) {
  await requireRole("driver");
  const stop = await loadStop(stopId);
  if (!stop) return { error: "Stop not found." };

  if (
    stop.status === "en_route" ||
    stop.status === "arrived" ||
    stop.status === "picked_up" ||
    stop.status === "dropped_off"
  ) {
    return { success: true, alreadyDone: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("stops")
    .update({
      status: "en_route",
      en_route_at: new Date().toISOString(),
      driver_lat: lat,
      driver_lng: lng,
    })
    .eq("id", stopId)
    .eq("status", "scheduled");

  if (error) return { error: error.message };

  await supabase
    .from("hikes")
    .update({ status: "in_progress" })
    .eq("id", stop.hike_id)
    .eq("status", "planned");

  const dog = one(stop.dogs);
  const customer = one(dog?.customers);

  if (dog) {
    await logNotification({
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogId: stop.dog_id,
      stopId,
      notificationType: "en_route",
      body: buildEnRouteMessage(
        customer?.owner_name ?? "",
        dog.name,
        stop.stop_type as "pickup" | "dropoff"
      ),
    });
  }

  revalidateDriverPaths();
  return { success: true };
}

export async function arrivedAction(
  stopId: string,
  lat: number | null = null,
  lng: number | null = null
) {
  await requireRole("driver");
  const stop = await loadStop(stopId);
  if (!stop) return { error: "Stop not found." };

  if (
    stop.status === "picked_up" ||
    stop.status === "dropped_off" ||
    stop.status === "arrived"
  ) {
    return { success: true, alreadyDone: true };
  }

  if (stop.status !== "en_route") {
    return { error: "Mark en route before arriving." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("stops")
    .update({
      status: "arrived",
      arrived_at: new Date().toISOString(),
      ...(lat != null && lng != null
        ? { driver_lat: lat, driver_lng: lng }
        : {}),
    })
    .eq("id", stopId)
    .eq("status", "en_route");

  if (error) return { error: error.message };

  const dog = one(stop.dogs);
  const customer = one(dog?.customers);

  if (dog) {
    await logNotification({
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogId: stop.dog_id,
      stopId,
      notificationType: "arrived",
      body: buildArrivedMessage(
        customer?.owner_name ?? "",
        dog.name,
        stop.stop_type as "pickup" | "dropoff"
      ),
    });
  }

  revalidateDriverPaths();
  return { success: true };
}

export async function completePickupAction(stopId: string) {
  await requireRole("driver");
  const stop = await loadStop(stopId);
  if (!stop) return { error: "Stop not found." };
  if (stop.stop_type !== "pickup") return { error: "Not a pickup stop." };

  if (stop.status === "picked_up") {
    return { success: true, alreadyDone: true };
  }

  if (stop.status !== "arrived") {
    return { error: "Mark arrived before picking up." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("stops")
    .update({
      status: "picked_up",
      completed_at: new Date().toISOString(),
    })
    .eq("id", stopId)
    .eq("status", "arrived");

  if (error) return { error: error.message };

  const dog = one(stop.dogs);
  if (dog) {
    await logNotification({
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogId: stop.dog_id,
      stopId,
      notificationType: "picked_up",
      body: buildPickedUpMessage(dog.name),
    });
  }

  revalidateDriverPaths();
  return { success: true };
}

export async function completeDropoffAction(stopId: string) {
  await requireRole("driver");
  const stop = await loadStop(stopId);
  if (!stop) return { error: "Stop not found." };
  if (stop.stop_type !== "dropoff") return { error: "Not a drop-off stop." };

  if (stop.status === "dropped_off") {
    return { success: true, alreadyDone: true };
  }

  if (stop.status !== "arrived") {
    return { error: "Mark arrived before dropping off." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("stops")
    .update({
      status: "dropped_off",
      completed_at: new Date().toISOString(),
    })
    .eq("id", stopId)
    .eq("status", "arrived");

  if (error) return { error: error.message };

  const dog = one(stop.dogs);
  if (dog) {
    await logNotification({
      companyId: dog.company_id,
      customerId: dog.customer_id,
      dogId: stop.dog_id,
      stopId,
      notificationType: "dropped_off",
      body: buildDroppedOffMessage(dog.name),
    });
  }

  await markHikeCompletedIfDone(stop.hike_id);

  revalidateDriverPaths();
  return { success: true };
}

async function markHikeCompletedIfDone(hikeId: string) {
  const supabase = await createClient();
  const { data: stops } = await supabase
    .from("stops")
    .select("status")
    .eq("hike_id", hikeId);

  const allDone = (stops ?? []).every(
    (s) => s.status === "picked_up" || s.status === "dropped_off" || s.status === "skipped"
  );

  if (allDone && (stops ?? []).length > 0) {
    await supabase.from("hikes").update({ status: "completed" }).eq("id", hikeId);
  }
}

function revalidateDriverPaths() {
  revalidatePath("/today");
  revalidatePath("/dashboard/hikes/today");
}
