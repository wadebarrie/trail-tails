type GateRow = {
  onboarding_completed_at?: string | null;
  onboarding_dismissed_at?: string | null;
};

type CompanyGateClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{
          data: GateRow | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export type OnboardingGate = {
  completedAt: string | null;
  dismissedAt: string | null;
};

/**
 * Read the wizard gate. If the dismiss column is not applied yet, fall back
 * to onboarding_completed_at so unfinished companies still enter setup.
 */
export async function readOnboardingGate(
  supabase: object,
  companyId: string
): Promise<OnboardingGate> {
  const client = supabase as CompanyGateClient;
  const full = await client
    .from("companies")
    .select("onboarding_completed_at, onboarding_dismissed_at")
    .eq("id", companyId)
    .maybeSingle();

  if (!full.error) {
    return {
      completedAt: full.data?.onboarding_completed_at ?? null,
      dismissedAt: full.data?.onboarding_dismissed_at ?? null,
    };
  }

  const legacy = await client
    .from("companies")
    .select("onboarding_completed_at")
    .eq("id", companyId)
    .maybeSingle();

  if (legacy.error) {
    return { completedAt: "complete", dismissedAt: null };
  }

  return {
    completedAt: legacy.data?.onboarding_completed_at ?? null,
    dismissedAt: null,
  };
}
