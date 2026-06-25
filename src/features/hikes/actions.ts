"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";

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

  for (let i = 0; i < orderedStopIds.length; i++) {
    const { error } = await supabase
      .from("stops")
      .update({ sort_order: 1000 + i })
      .eq("id", orderedStopIds[i])
      .eq("hike_id", hikeId)
      .eq("stop_type", stopType);
    if (error) return { error: error.message };
  }

  for (let i = 0; i < orderedStopIds.length; i++) {
    const { error } = await supabase
      .from("stops")
      .update({ sort_order: i })
      .eq("id", orderedStopIds[i])
      .eq("hike_id", hikeId)
      .eq("stop_type", stopType);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  return { success: true };
}

export async function reorderDefaultRouteAction(orderedDogIds: string[]) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  for (let i = 0; i < orderedDogIds.length; i++) {
    const { error } = await supabase
      .from("dogs")
      .update({ route_sort_order: 1000 + i })
      .eq("id", orderedDogIds[i])
      .eq("company_id", profile.company_id);
    if (error) return { error: error.message };
  }

  for (let i = 0; i < orderedDogIds.length; i++) {
    const { error } = await supabase
      .from("dogs")
      .update({ route_sort_order: i })
      .eq("id", orderedDogIds[i])
      .eq("company_id", profile.company_id);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  return { success: true };
}
