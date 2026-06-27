"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole } from "@/features/auth/queries";
import {
  driverCreateSchema,
  driverUpdateSchema,
} from "@/features/drivers/schema";

function normalizePhone(phone: string | undefined) {
  const trimmed = phone?.trim();
  return trimmed ? trimmed : null;
}

export async function createDriverAction(
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = driverCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const service = createServiceClient();
  const { data: authData, error: authError } =
    await service.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        company_id: profile.company_id,
        role: "driver",
        full_name: parsed.data.full_name,
      },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Failed to create driver account." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone) {
    const { error: profileError } = await service
      .from("profiles")
      .update({ phone })
      .eq("id", authData.user.id)
      .eq("company_id", profile.company_id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  redirect("/dashboard/drivers");
}

export async function updateDriverAction(
  id: string,
  _prev: { error?: string },
  formData: FormData
) {
  const profile = await requireRole("admin");
  const parsed = driverUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role, company_id")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!existing || existing.role !== "driver") {
    return { error: "Driver not found." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: normalizePhone(parsed.data.phone),
      is_active: formData.has("is_active"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const service = createServiceClient();
  await service.auth.admin.updateUserById(id, {
    user_metadata: { full_name: parsed.data.full_name },
  });

  revalidatePath("/dashboard/drivers");
  revalidatePath(`/dashboard/drivers/${id}`);
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  redirect("/dashboard/drivers");
}

export async function getDriverEmail(driverId: string): Promise<string | null> {
  await requireRole("admin");
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(driverId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
