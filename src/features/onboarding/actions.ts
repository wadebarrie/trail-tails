"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/queries";
import {
  isOnboardingComplete,
  ONBOARDING_PATH,
} from "@/features/onboarding/constants";
import { getOnboardingProgress } from "@/features/onboarding/queries";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { passwordSchema } from "@/lib/password";
import { areInvitesEnabled, isSelfSignupEnabled } from "@/features/platform/settings";
import {
  parseVehicleCapacity,
  vehicleSchema,
} from "@/features/vehicles/schema";

const selfSignupSchema = z
  .object({
    company_name: z.string().min(1, "Company name is required."),
    timezone: z.string().min(1, "Timezone is required."),
    admin_full_name: z.string().min(1, "Your name is required."),
    admin_email: z.string().email("Valid email is required."),
    password: passwordSchema,
    password_confirm: z.string().min(1),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export type SelfSignupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function selfSignupAction(
  _prev: SelfSignupResult | { error?: string },
  formData: FormData
): Promise<SelfSignupResult> {
  try {
    if (!(await areInvitesEnabled())) {
      return {
        ok: false,
        error:
          "New signups are temporarily paused. Contact PackRoute support for help.",
      };
    }

    if (!(await isSelfSignupEnabled())) {
      return {
        ok: false,
        error:
          "Self-serve signup is not open yet. Ask PackRoute for an invite link.",
      };
    }

    const parsed = selfSignupSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      };
    }

    const email = parsed.data.admin_email.trim().toLowerCase();
    const service = createServiceClient();

    const { data: company, error: companyError } = await service
      .from("companies")
      .insert({
        name: parsed.data.company_name.trim(),
        timezone: parsed.data.timezone,
        // Explicit null so first-run wizard runs (backfill set existing rows).
        onboarding_completed_at: null,
      })
      .select("id")
      .single();

    if (companyError || !company) {
      const message =
        typeof companyError?.message === "string" && companyError.message.trim()
          ? companyError.message.trim()
          : "Could not create your company.";
      return { ok: false, error: message };
    }

    const { data: authData, error: authError } =
      await service.auth.admin.createUser({
        email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: {
          company_id: company.id,
          role: "admin",
          full_name: parsed.data.admin_full_name.trim(),
          can_drive: true,
        },
      });

    if (authError || !authData.user) {
      await service.from("companies").delete().eq("id", company.id);
      const authMessage =
        typeof authError?.message === "string" ? authError.message : "";
      if (authMessage.toLowerCase().includes("already")) {
        return {
          ok: false,
          error:
            "An account with this email already exists. Try signing in instead.",
        };
      }
      return {
        ok: false,
        error: authMessage.trim() || "Could not create your account.",
      };
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });

    if (signInError) {
      return {
        ok: false,
        error: "Account created — please sign in to continue setup.",
      };
    }

    revalidatePath("/signup");
    redirect(ONBOARDING_PATH);
  } catch (error) {
    // redirect() throws a special Next.js error — rethrow it.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Could not complete signup. Try again.";
    return { ok: false, error: message === "{}" ? "Could not complete signup. Try again." : message };
  }
}

export async function completeOnboardingAction(): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function dismissOnboardingAction(): Promise<{ error?: string }> {
  return completeOnboardingAction();
}

/** Create first vehicle from the wizard, then advance. */
export async function onboardingCreateVehicleAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert({
    company_id: profile.company_id,
    name: parsed.data.name.trim(),
    plate: parsed.data.plate?.trim() || null,
    capacity: parseVehicleCapacity(parsed.data.capacity),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/vehicles");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=driver`);
}

export async function onboardingEnableSelfAsDriverAction(): Promise<{
  error?: string;
}> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ can_drive: true })
    .eq("id", profile.id)
    .eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drivers");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=customer`);
}

/** @deprecated Use onboardingEnableSelfAsDriverAction */
export const onboardingEnableSelfAsHikerAction =
  onboardingEnableSelfAsDriverAction;

const companyInfoSchema = z.object({
  default_hike_rate: z.string().min(1, "Default hike price is required."),
  night_before_reminder_time: z
    .string()
    .min(1, "Reminder time is required."),
});

function parseRateToCents(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseFloat(raw.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Save company defaults from the wizard, then advance to done. */
export async function onboardingSaveCompanyInfoAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const parsed = companyInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rateCents = parseRateToCents(parsed.data.default_hike_rate);
  if (rateCents == null) {
    return { error: "Enter a valid hike price (e.g. 60.00)" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      default_hike_rate_cents: rateCents,
      night_before_reminder_time: parsed.data.night_before_reminder_time,
    })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/billing");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=done`);
}

export async function maybeAutoCompleteOnboarding(
  companyId: string
): Promise<void> {
  const progress = await getOnboardingProgress(companyId);
  if (progress.completedAt || !isOnboardingComplete(progress)) return;

  const supabase = await createClient();
  await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", companyId)
    .is("onboarding_completed_at", null);
}
