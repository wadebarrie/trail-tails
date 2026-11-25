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
  abandonSelfSignup,
  requestSelfSignup,
  resendSelfSignup,
  type SelfSignupResult,
} from "@/features/onboarding/self-signup.server";
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

export type { SelfSignupResult };

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

    return await requestSelfSignup({
      companyName: parsed.data.company_name.trim(),
      timezone: parsed.data.timezone,
      fullName: parsed.data.admin_full_name.trim(),
      email: parsed.data.admin_email,
      password: parsed.data.password,
      captchaToken: formData.get("captcha_token")?.toString() ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Could not complete signup. Try again.";
    return {
      ok: false,
      error: message === "{}" ? "Could not complete signup. Try again." : message,
    };
  }
}

export async function resendSelfSignupAction(
  _prev: { error?: string; warning?: string },
  formData: FormData
): Promise<{ error?: string; warning?: string }> {
  const result = await resendSelfSignup(
    formData.get("email")?.toString() ?? "",
    formData.get("captcha_token")?.toString() ?? null
  );
  if (!result.ok) return { error: result.error };
  return { warning: result.warning };
}

export async function changeSelfSignupEmailAction(email: string): Promise<void> {
  await abandonSelfSignup(email);
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
  // Own-row can_drive changes are rejected for the caller's JWT.
  const service = createServiceClient();

  const { error } = await service
    .from("profiles")
    .update({ can_drive: true })
    .eq("id", profile.id)
    .eq("company_id", profile.company_id)
    .eq("role", "admin");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/drivers");
  revalidatePath(ONBOARDING_PATH);
  redirect(`${ONBOARDING_PATH}?step=customer`);
}

/** Persist once-vs-twice PackRoute cadence from onboarding. */
export async function onboardingSaveRouteCadenceAction(
  cadence: "once" | "twice"
): Promise<{ error?: string }> {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  if (cadence !== "once" && cadence !== "twice") {
    return { error: "Choose once or twice per day." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ route_cadence: cadence })
    .eq("id", profile.company_id);

  if (error) return { error: error.message };

  revalidatePath(ONBOARDING_PATH);
  revalidatePath("/dashboard/route");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hikes/today");
  revalidatePath("/dashboard/hikes/tomorrow");
  revalidatePath("/today");
  revalidatePath("/tomorrow");
  return {};
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
