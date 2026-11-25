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
import { driverProfileUpdate } from "@/features/drivers/profile-update";
import { profileProvisioningMetadata } from "@/features/auth/profile-provisioning";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { safeAppReturnPath } from "@/lib/safe-return-path";
import { getAuthCallbackUrl } from "@/lib/site-url";

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

/**
 * inviteUserByEmail cannot set app_metadata, and GoTrue applies app_metadata
 * only after the auth user row is inserted. Create the user first so
 * handle_new_user can read company_id and role, then send the invite email.
 * email_confirm stays false so the invite link is what lets them set a password.
 */
async function createInvitedDriver(
  service: ReturnType<typeof createServiceClient>,
  input: { email: string; fullName: string; companyId: string }
): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; emailTaken: boolean }
> {
  const metadata = profileProvisioningMetadata({
    companyId: input.companyId,
    role: "driver",
    fullName: input.fullName,
    canDrive: true,
  });

  const created = await service.auth.admin.createUser({
    email: input.email,
    email_confirm: false,
    app_metadata: metadata.app_metadata,
    user_metadata: metadata.user_metadata,
  });

  if (created.error || !created.data.user) {
    const message = created.error?.message ?? "Failed to create driver account.";
    return {
      ok: false,
      error: message,
      emailTaken: isEmailTakenError(created.error?.message),
    };
  }

  const invited = await service.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: getAuthCallbackUrl(AUTH_ROUTES.resetPassword),
    data: metadata.user_metadata,
  });

  if (invited.error) {
    await service.auth.admin.deleteUser(created.data.user.id);
    return { ok: false, error: invited.error.message, emailTaken: false };
  }

  return { ok: true, userId: created.data.user.id };
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
  const invited = await createInvitedDriver(service, {
    email,
    fullName: parsed.data.full_name,
    companyId: profile.company_id,
  });

  if (!invited.ok) {
    if (invited.emailTaken) {
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
          redirect(
            safeAppReturnPath(
              formData.get("returnTo")?.toString(),
              "/dashboard/drivers"
            )
          );
        }
      }

      return {
        error:
          "That email already has an account. Company admins use the same login for the driver app — enable “Also drives” on their profile, or sign in as that admin.",
      };
    }
    return { error: invited.error };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone) {
    const { error: profileError } = await service
      .from("profiles")
      .update({ phone })
      .eq("id", invited.userId)
      .eq("company_id", profile.company_id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidateDriverPaths();
  redirect(
    safeAppReturnPath(
      formData.get("returnTo")?.toString(),
      "/dashboard/drivers"
    )
  );
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
    .select("id, role, company_id, can_drive, is_active")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  const isDriverRow = existing?.role === "driver";
  const isDrivingAdmin =
    existing?.role === "admin" && existing.can_drive === true;

  if (!existing || (!isDriverRow && !isDrivingAdmin)) {
    return { error: "Driver not found." };
  }

  const decision = driverProfileUpdate({
    actorId: profile.id,
    targetId: id,
    existingIsActive: existing.is_active === true,
    existingCanDrive: existing.can_drive === true,
    patch: {
      full_name: parsed.data.full_name,
      phone: normalizePhone(parsed.data.phone),
      is_active: formData.has("is_active"),
      ...(existing.role === "admin"
        ? { can_drive: formData.has("can_drive") }
        : {}),
    },
  });

  if (!decision.ok) return { error: decision.error };

  const { error } = await supabase
    .from("profiles")
    .update(decision.updates)
    .eq("id", id);

  if (error) return { error: error.message };

  const service = createServiceClient();
  await service.auth.admin.updateUserById(id, {
    user_metadata: { full_name: parsed.data.full_name },
  });

  revalidateDriverPaths(id);
  redirect("/dashboard/drivers");
}

/**
 * Enable the signed-in company admin to use /today with the same login.
 * Their JWT cannot change can_drive on their own row. This sets only that
 * flag, and only for an admin in their own company.
 */
export async function enableSelfAsDriverAction(): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const service = createServiceClient();

  const { error } = await service
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

export async function resendDriverInviteAction(
  driverId: string
): Promise<{ error?: string; ok?: boolean }> {
  const profile = await requireRole("admin");
  const service = createServiceClient();
  const { data: existing } = await service
    .from("profiles")
    .select("id, role, company_id")
    .eq("id", driverId)
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .maybeSingle();

  if (!existing) return { error: "Driver not found." };

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(driverId);
  const email = userData.user?.email;
  if (userError || !email) return { error: "No login email for this driver." };

  const redirectTo = getAuthCallbackUrl(AUTH_ROUTES.resetPassword);
  // Service role skips Auth captcha, so enabling Turnstile does not block
  // an admin resending a driver invite from the dashboard.
  const { error } = await service.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function getDriverEmail(driverId: string): Promise<string | null> {
  await requireRole("admin");
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(driverId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
