import { EmailOtpMfaForm } from "@/features/auth/components/email-otp-mfa-form";
import { PageHeader } from "@/features/admin/components/ui";
import { postAuthDestination, turnstileSiteKey } from "@/features/auth/signup-guards";
import { getAdminMfaStatus } from "@/features/auth/mfa";
import { getCurrentProfile } from "@/features/auth/queries";
import { companyNeedsOnboarding } from "@/features/onboarding/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; verify?: string }>;
}) {
  const { verify } = await searchParams;
  const status = await getAdminMfaStatus();

  if (!status.needsVerify && !verify) {
    const profile = await getCurrentProfile();
    const needsOnboarding =
      profile?.role === "admin" &&
      (await companyNeedsOnboarding(profile.company_id));
    redirect(
      postAuthDestination({
        role: profile?.role === "driver" ? "driver" : "admin",
        canDrive: profile?.can_drive === true,
        onboardingCompletedAt: needsOnboarding ? null : "complete",
        next: null,
      })
    );
  }

  return (
    <div className="max-w-md">
      <PageHeader
        title="Check your email"
        description="Admin sign-in needs a one-time code we send to your email — no authenticator app required."
      />

      <EmailOtpMfaForm
        stayOnPage
        showTotpOption={status.totpEnrolled}
        siteKey={turnstileSiteKey()}
      />
    </div>
  );
}
