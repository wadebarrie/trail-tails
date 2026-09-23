import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { hasValidAdminEmailMfaCookie } from "@/lib/auth/admin-email-mfa";
import { createClient } from "@/lib/supabase/server";

export type AdminMfaStatus = {
  /** True when a second factor is available (email OTP always is; or TOTP enrolled). */
  enrolled: boolean;
  /** Preferred step-up method for UI. */
  method: "email" | "totp";
  /** True when TOTP is enrolled (optional authenticator path). */
  totpEnrolled: boolean;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  needsVerify: boolean;
  emailSatisfied: boolean;
  totpSatisfied: boolean;
};

export async function getAdminMfaStatus(): Promise<AdminMfaStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();

  const totpEnrolled = (factors?.totp ?? []).some(
    (factor) => factor.status === "verified"
  );
  const currentLevel = (aal?.currentLevel ?? null) as AdminMfaStatus["currentLevel"];
  const nextLevel = (aal?.nextLevel ?? null) as AdminMfaStatus["nextLevel"];
  const totpSatisfied = totpEnrolled && currentLevel === "aal2";
  const emailSatisfied = user?.id
    ? await hasValidAdminEmailMfaCookie(user.id)
    : false;

  const satisfied = totpSatisfied || emailSatisfied;

  return {
    // Email OTP needs no enrollment — always available for admins.
    enrolled: true,
    method: totpEnrolled && !emailSatisfied ? "totp" : "email",
    totpEnrolled,
    currentLevel,
    nextLevel,
    needsVerify: !satisfied,
    emailSatisfied,
    totpSatisfied,
  };
}

/** Server-side MFA gate for admin actions and API routes. */
export async function requireAdminMfa(): Promise<void> {
  const status = await getAdminMfaStatus();

  if (status.needsVerify) {
    redirect(`${AUTH_ROUTES.adminMfa}?verify=1`);
  }
}

export async function isAdminMfaSatisfied(): Promise<boolean> {
  const status = await getAdminMfaStatus();
  return !status.needsVerify;
}
