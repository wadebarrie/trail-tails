"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import {
  parseVehicleCapacity,
  vehicleSchema,
} from "@/features/vehicles/schema";
import { safeAppReturnPath } from "@/lib/safe-return-path";

function parseVehicleForm(formData: FormData, mode: "create" | "update") {
  const raw = Object.fromEntries(formData);
  const withFlags: Record<string, unknown> = { ...raw };

  if (mode === "update") {
    withFlags.is_active = formData.get("is_active") === "true";
  }

  return vehicleSchema.safeParse(withFlags);
}

function vehiclePayload(data: {
  name: string;
  plate?: string;
  capacity?: string;
  is_active?: boolean;
}) {
  return {
    name: data.name.trim(),
    plate: data.plate?.trim() || null,
    capacity: parseVehicleCapacity(data.capacity),
    is_active: data.is_active ?? true,
  };
}

function revalidateVehiclePaths() {
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
}

export async function createVehicleAction(
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = parseVehicleForm(formData, "create");

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    company_id: profile.company_id,
    ...vehiclePayload(parsed.data),
  });

  if (error) return { error: error.message };

  revalidateVehiclePaths();
  redirect(
    safeAppReturnPath(
      formData.get("returnTo")?.toString(),
      "/dashboard/vehicles"
    )
  );
}

export async function updateVehicleAction(
  id: string,
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = parseVehicleForm(formData, "update");

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update(vehiclePayload(parsed.data))
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  revalidateVehiclePaths();
  redirect("/dashboard/vehicles");
}
