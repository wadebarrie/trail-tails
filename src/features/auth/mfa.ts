import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants";
import { createClient } from "@/lib/supabase/server";

export type AdminMfaStatus = {
  enrolled: boolean;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  needsVerify: boolean;
};

export async function getAdminMfaStatus(): Promise<AdminMfaStatus> {
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors } = await supabase.auth.mfa.listFactors();

  const enrolled = (factors?.totp ?? []).some((factor) => factor.status === "verified");
  const currentLevel = (aal?.currentLevel ?? null) as AdminMfaStatus["currentLevel"];
  const nextLevel = (aal?.nextLevel ?? null) as AdminMfaStatus["nextLevel"];
  const needsVerify =
    enrolled && currentLevel === "aal1" && nextLevel === "aal2";

  return { enrolled, currentLevel, nextLevel, needsVerify };
}

/** Server-side MFA gate for admin actions and API routes. */
export async function requireAdminMfa(): Promise<void> {
  const status = await getAdminMfaStatus();

  if (!status.enrolled) {
    redirect(`${AUTH_ROUTES.adminMfa}?setup=1`);
  }

  if (status.needsVerify || status.currentLevel !== "aal2") {
    redirect(`${AUTH_ROUTES.adminMfa}?verify=1`);
  }
}

export async function isAdminMfaSatisfied(): Promise<boolean> {
  const status = await getAdminMfaStatus();
  return status.enrolled && status.currentLevel === "aal2";
}
