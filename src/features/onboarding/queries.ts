import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingProgress } from "@/features/onboarding/constants";

export const getOnboardingProgress = cache(
  async (companyId: string): Promise<OnboardingProgress> => {
    const supabase = await createClient();

    const [
      { data: company },
      vehicles,
      drivers,
      customers,
      dogs,
      routes,
      dogsOnRoute,
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
        .select("id, route_schedule_days ( day_of_week )")
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("dogs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true)
        .not("route_id", "is", null),
    ]);

    const routeRows = routes.data ?? [];
    const created = routeRows.length > 0;
    const hasScheduleDays = routeRows.some((route) => {
      const days = route.route_schedule_days as
        | { day_of_week: number }[]
        | null
        | undefined;
      return (days?.length ?? 0) > 0;
    });
    const hasDogAssigned = (dogsOnRoute.count ?? 0) > 0;

    return {
      hasVehicle: (vehicles.count ?? 0) > 0,
      hasDriver: (drivers.count ?? 0) > 0,
      hasCustomer: (customers.count ?? 0) > 0,
      hasDog: (dogs.count ?? 0) > 0,
      hasRoute: created && hasScheduleDays && hasDogAssigned,
      routeChecklist: {
        created,
        hasScheduleDays,
        hasDogAssigned,
      },
      hasCompanyInfo: company?.default_hike_rate_cents != null,
      completedAt: company?.onboarding_completed_at ?? null,
    };
  }
);

export async function companyNeedsOnboarding(companyId: string): Promise<boolean> {
  const progress = await getOnboardingProgress(companyId);
  return progress.completedAt == null;
}
