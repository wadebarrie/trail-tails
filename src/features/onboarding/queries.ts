import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingProgress } from "@/features/onboarding/constants";

export const getOnboardingProgress = cache(
  async (companyId: string): Promise<OnboardingProgress> => {
    const supabase = await createClient();

    const [
      { data: company },
      vehicles,
      hikers,
      customers,
      dogs,
      routes,
    ] = await Promise.all([
      supabase
        .from("companies")
        .select("onboarding_completed_at, default_hike_rate_cents")
        .eq("id", companyId)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true)
        .or("role.eq.driver,can_drive.eq.true"),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("dogs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("routes")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
    ]);

    return {
      hasVehicle: (vehicles.count ?? 0) > 0,
      hasHiker: (hikers.count ?? 0) > 0,
      hasCustomer: (customers.count ?? 0) > 0,
      hasDog: (dogs.count ?? 0) > 0,
      hasRoute: (routes.count ?? 0) > 0,
      hasCompanyInfo: company?.default_hike_rate_cents != null,
      completedAt: company?.onboarding_completed_at ?? null,
    };
  }
);

export async function companyNeedsOnboarding(companyId: string): Promise<boolean> {
  const progress = await getOnboardingProgress(companyId);
  return progress.completedAt == null;
}
