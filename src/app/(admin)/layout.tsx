import type { Metadata } from "next";
import { AdminMfaGate } from "@/features/auth/components/admin-mfa-gate";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { getCompanyName } from "@/features/company/queries";
import { requireRole } from "@/features/auth/queries";
import { getAdminMfaStatus } from "@/features/auth/mfa";
import { companyNeedsOnboarding } from "@/features/onboarding/queries";
import { OnboardingSetupBanner } from "@/features/onboarding/components/onboarding-setup-banner";
import { getSubscriptionForCompany } from "@/features/subscription/queries";
import {
  daysRemainingInTrial,
  shouldShowTrialExpiringBanner,
} from "@/features/subscription/helpers";
import { TrialExpiringBanner } from "@/features/subscription/components/trial-expiring-banner";
import { createClient } from "@/lib/supabase/server";
import { PerfTimer } from "@/lib/perf";
import { SkipLink } from "@/features/shared/components/skip-link";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const timer = new PerfTimer("page admin-layout");
  const profile = await requireRole("admin", { skipMfaCheck: true });
  timer.mark("auth");

  const supabase = await createClient();
  const [
    mfaStatus,
    companyName,
    { count: pendingRequestCount },
    needsOnboarding,
    subscription,
  ] = await Promise.all([
    getAdminMfaStatus(),
    getCompanyName(profile.company_id),
    supabase
      .from("pending_requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("status", "pending"),
    companyNeedsOnboarding(profile.company_id),
    getSubscriptionForCompany(profile.company_id),
  ]);
  timer.end();

  const trialDaysRemaining =
    subscription && shouldShowTrialExpiringBanner(subscription)
      ? daysRemainingInTrial(subscription)
      : null;

  const pending = pendingRequestCount ?? 0;

  return (
    <div className="min-h-dvh bg-atmosphere md:flex">
      <SkipLink />
      <AdminSidebar companyName={companyName} pendingRequestCount={pending} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar profile={profile} companyName={companyName} />

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] md:px-6 md:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8"
        >
          {needsOnboarding ? <OnboardingSetupBanner /> : null}
          {trialDaysRemaining != null ? (
            <TrialExpiringBanner daysRemaining={trialDaysRemaining} />
          ) : null}
          <AdminMfaGate status={mfaStatus}>{children}</AdminMfaGate>
        </main>
      </div>

      <AdminNav pendingRequestCount={pending} />
    </div>
  );
}
