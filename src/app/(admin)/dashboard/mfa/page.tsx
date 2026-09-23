import { EmailOtpMfaForm } from "@/features/auth/components/email-otp-mfa-form";
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
  const { verify } = await searchParams;
  const status = await getAdminMfaStatus();

  if (!status.needsVerify && !verify) {
    redirect(AUTH_ROUTES.adminHome);
  }

  return (
    <div className="max-w-md">
      <PageHeader
        title="Check your email"
        description="Admin sign-in needs a one-time code we send to your email — no authenticator app required."
      />

      <EmailOtpMfaForm stayOnPage showTotpOption={status.totpEnrolled} />
    </div>
  );
}
