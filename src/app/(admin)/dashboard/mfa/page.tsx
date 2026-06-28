import { MfaEnrollForm } from "@/features/auth/components/mfa-enroll-form";
import { MfaVerifyForm } from "@/features/auth/components/mfa-verify-form";
import { PageHeader } from "@/features/admin/components/ui";
import { getAdminMfaStatus } from "@/features/auth/mfa";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; verify?: string }>;
}) {
  const { setup, verify } = await searchParams;
  const status = await getAdminMfaStatus();

  if (status.enrolled && status.currentLevel === "aal2" && !setup && !verify) {
    redirect(AUTH_ROUTES.adminHome);
  }

  const showSetup = setup === "1" || !status.enrolled;
  const showVerify = verify === "1" || (status.enrolled && status.needsVerify);

  return (
    <div className="max-w-md">
      <PageHeader
        title="Two-factor authentication"
        description="Admin accounts require an authenticator app (TOTP) for sign-in."
      />

      {showSetup && !status.enrolled ? <MfaEnrollForm /> : null}

      {showVerify && status.enrolled ? (
        <MfaVerifyForm stayOnPage />
      ) : null}

      {!showSetup && !showVerify && status.enrolled ? (
        <p className="text-sm text-stone-600">
          Your authenticator is set up.{" "}
          <a href={AUTH_ROUTES.adminHome} className="text-[var(--color-trail-700)] hover:underline">
            Continue to dashboard
          </a>
        </p>
      ) : null}
    </div>
  );
}
