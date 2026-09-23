import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import {
  nextIncompleteStep,
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/features/onboarding/constants";
import { getOnboardingProgress } from "@/features/onboarding/queries";
import { createClient } from "@/lib/supabase/server";

function parseStep(raw: string | undefined): OnboardingStepId | null {
  if (!raw) return null;
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

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .maybeSingle();

  const { step: rawStep } = await searchParams;
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
    />
  );
}
