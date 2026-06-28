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
