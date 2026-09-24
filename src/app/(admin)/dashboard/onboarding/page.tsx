import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import {
  nextIncompleteStep,
  ONBOARDING_LEGACY_STEP_ALIASES,
  ONBOARDING_PATH,
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/features/onboarding/constants";
import { getOnboardingProgress } from "@/features/onboarding/queries";
import { createClient } from "@/lib/supabase/server";

function parseStep(raw: string | undefined): OnboardingStepId | null {
  if (!raw) return null;
  if (ONBOARDING_LEGACY_STEP_ALIASES[raw]) {
    return ONBOARDING_LEGACY_STEP_ALIASES[raw];
  }
  return (ONBOARDING_STEPS as readonly string[]).includes(raw)
    ? (raw as OnboardingStepId)
    : null;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const profile = await requireRole("admin", { skipMfaCheck: true });
  const progress = await getOnboardingProgress(profile.company_id);

  if (progress.completedAt) {
    redirect("/dashboard");
  }

  const { step: rawStep } = await searchParams;
  if (rawStep && ONBOARDING_LEGACY_STEP_ALIASES[rawStep]) {
    redirect(
      `${ONBOARDING_PATH}?step=${ONBOARDING_LEGACY_STEP_ALIASES[rawStep]}`
    );
  }

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name, default_hike_rate_cents, night_before_reminder_time")
    .eq("id", profile.company_id)
    .maybeSingle();

  const requested = parseStep(rawStep);
  const step =
    requested ??
    (progress.hasVehicle || progress.hasCustomer
      ? nextIncompleteStep(progress)
      : "welcome");

  return (
    <OnboardingWizard
      step={step}
      progress={progress}
      companyName={company?.name ?? "your company"}
      adminCanDrive={profile.can_drive}
      defaultHikeRateCents={company?.default_hike_rate_cents ?? null}
      nightBeforeReminderTime={
        company?.night_before_reminder_time ?? "19:30:00"
      }
    />
  );
}
