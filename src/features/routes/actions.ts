"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { getDateInTimezone } from "@/lib/dates";

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
