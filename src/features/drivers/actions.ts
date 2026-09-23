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

function isEmailTakenError(message: string | undefined) {
  const lower = message?.toLowerCase() ?? "";
  return (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("exists")
  );
}

async function findAuthUserIdByEmail(
  service: ReturnType<typeof createServiceClient>,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error || !data?.users?.length) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 20) return null;
  }
}

function revalidateDriverPaths(driverId?: string) {
  revalidatePath("/dashboard/drivers");
  if (driverId) revalidatePath(`/dashboard/drivers/${driverId}`);
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
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

  const email = parsed.data.email.trim().toLowerCase();
  const service = createServiceClient();
  const { data: authData, error: authError } =
    await service.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        company_id: profile.company_id,
        role: "driver",
        full_name: parsed.data.full_name,
      },
    });

  if (authError || !authData.user) {
    if (isEmailTakenError(authError?.message)) {
      const existingId = await findAuthUserIdByEmail(service, email);
      if (existingId) {
        const { data: existingProfile } = await service
          .from("profiles")
          .select("id, role, company_id, can_drive")
          .eq("id", existingId)
          .maybeSingle();

        if (
          existingProfile &&
          existingProfile.company_id === profile.company_id &&
          existingProfile.role === "admin"
        ) {
          const phone = normalizePhone(parsed.data.phone);
          const { error: enableError } = await service
            .from("profiles")
            .update({
              can_drive: true,
              full_name: parsed.data.full_name,
              ...(phone ? { phone } : {}),
              is_active: true,
            })
            .eq("id", existingId);

          if (enableError) return { error: enableError.message };

          revalidateDriverPaths(existingId);
          redirect("/dashboard/drivers");
        }
      }

      return {
        error:
          "That email already has an account. Company admins use the same login for the driver app — enable “Also drives” on their profile, or sign in as that admin.",
      };
    }
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

  revalidateDriverPaths();
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
    .select("id, role, company_id, can_drive")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  const isDriverRow = existing?.role === "driver";
  const isDrivingAdmin =
    existing?.role === "admin" && existing.can_drive === true;

  if (!existing || (!isDriverRow && !isDrivingAdmin)) {
    return { error: "Driver not found." };
  }

  const updates: {
    full_name: string;
    phone: string | null;
    is_active: boolean;
    can_drive?: boolean;
  } = {
    full_name: parsed.data.full_name,
    phone: normalizePhone(parsed.data.phone),
    is_active: formData.has("is_active"),
  };

  if (existing.role === "admin") {
    // Admins stay admins; toggling off removes them from the driver roster.
    updates.can_drive = formData.has("can_drive");
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", id);

  if (error) return { error: error.message };

  const service = createServiceClient();
  await service.auth.admin.updateUserById(id, {
    user_metadata: { full_name: parsed.data.full_name },
  });

  revalidateDriverPaths(id);
  redirect("/dashboard/drivers");
}

/** Enable the signed-in company admin to use /today with the same login. */
export async function enableSelfAsDriverAction(): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ can_drive: true })
    .eq("id", profile.id)
    .eq("company_id", profile.company_id)
    .eq("role", "admin");

  if (error) return { error: error.message };

  revalidateDriverPaths(profile.id);
  revalidatePath("/today");
  revalidatePath("/dashboard");
  return {};
}

export async function getDriverEmail(driverId: string): Promise<string | null> {
  await requireRole("admin");
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(driverId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
