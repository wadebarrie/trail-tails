import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import {
  ONBOARDING_LEGACY_STEP_ALIASES,
  ONBOARDING_PATH,
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/features/onboarding/constants";
import { getOnboardingProgress } from "@/features/onboarding/queries";
import { formatTrialEndDate } from "@/features/subscription/trial-clock";
import { createClient } from "@/lib/supabase/server";
import { buildGalleryUrl } from "@/features/hike-photos/share";
import type { WizardSmsMode } from "@/features/onboarding/first-value";
import { nextIncompleteStep as firstValueStep } from "@/features/onboarding/first-value";

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
  const [{ data: company }, smsSettings, { data: subscription }, { data: dog }, { data: share }, { data: invoice }] =
    await Promise.all([
    supabase
      .from("companies")
      .select(
        "name, timezone, default_hike_rate_cents, night_before_reminder_time, route_cadence"
      )
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("sms_mode, sms_test_phone")
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("company_id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("dogs")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hike_photo_shares")
      .select("token")
      .eq("company_id", profile.company_id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const trialEndsOn =
    subscription?.status === "trial" && subscription.trial_ends_at
      ? formatTrialEndDate(
          subscription.trial_ends_at,
          company?.timezone ?? "America/Vancouver"
        )
      : null;

  const requested = parseStep(rawStep);
  const step = requested ?? firstValueStep(progress);
  const smsMode: WizardSmsMode =
    !smsSettings.error && smsSettings.data?.sms_mode === "test" ? "test" : "live";

  return (
    <OnboardingWizard
      step={step}
      progress={progress}
      companyName={company?.name ?? "your company"}
      ownerName={profile.full_name}
      ownerPhone={smsSettings.data?.sms_test_phone || profile.phone || ""}
      dogId={dog?.id ?? null}
      dogName={dog?.name ?? null}
      smsMode={smsMode}
      defaultHikeRateCents={company?.default_hike_rate_cents ?? null}
      nightBeforeReminderTime={
        company?.night_before_reminder_time ?? "19:30:00"
      }
      initialRouteCadence={
        progress.welcomeSaved &&
        (company?.route_cadence === "once" || company?.route_cadence === "twice")
          ? company.route_cadence
          : null
      }
      initialOutingStyle={progress.outingStyle}
      trialEndsOn={trialEndsOn}
      galleryUrl={share?.token ? buildGalleryUrl(share.token) : null}
      invoiceId={invoice?.id ?? null}
    />
  );
}
