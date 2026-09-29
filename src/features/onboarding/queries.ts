import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  OnboardingPeriodChecklist,
  OnboardingProgress,
} from "@/features/onboarding/constants";
import type { HikePeriod } from "@/features/hikes/hike-period";

function periodChecklist(
  routes: {
    id: string;
    period: HikePeriod | null;
    route_schedule_days:
      | { day_of_week: number }[]
      | null
      | undefined;
  }[],
  dogRouteIds: Set<string>,
  period: HikePeriod
): OnboardingPeriodChecklist {
  const periodRoutes = routes.filter(
    (route) => (route.period ?? "morning") === period
  );
  const created = periodRoutes.length > 0;
  const hasScheduleDays = periodRoutes.some(
    (route) => (route.route_schedule_days?.length ?? 0) > 0
  );
  const hasDogAssigned = periodRoutes.some((route) =>
    dogRouteIds.has(route.id)
  );
  return {
    created,
    hasScheduleDays,
    hasDogAssigned,
    ready: created && hasScheduleDays && hasDogAssigned,
  };
}

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
        .select("id, period, route_schedule_days ( day_of_week )")
        .eq("company_id", companyId)
        .eq("is_active", true),
      supabase
        .from("dogs")
        .select("id, route_id")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .not("route_id", "is", null),
    ]);

    const routeRows = (routes.data ?? []) as {
      id: string;
      period: HikePeriod | null;
      route_schedule_days:
        | { day_of_week: number }[]
        | null
        | undefined;
    }[];
    const dogRouteIds = new Set(
      (dogsOnRoute.data ?? [])
        .map((dog) => dog.route_id)
        .filter((id): id is string => Boolean(id))
    );

    const created = routeRows.length > 0;
    const hasScheduleDays = routeRows.some(
      (route) => (route.route_schedule_days?.length ?? 0) > 0
    );
    const hasDogAssigned = dogRouteIds.size > 0;
    const morning = periodChecklist(routeRows, dogRouteIds, "morning");
    const afternoon = periodChecklist(routeRows, dogRouteIds, "afternoon");

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
        morning,
        afternoon,
      },
      hasCompanyInfo: company?.default_hike_rate_cents != null,
      completedAt: company?.onboarding_completed_at ?? null,
    };
  }
);

/** Cheap gate for redirects — avoids the full onboarding progress fan-out. */
export const companyNeedsOnboarding = cache(
  async (companyId: string): Promise<boolean> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("onboarding_completed_at")
      .eq("id", companyId)
      .maybeSingle();
    return data?.onboarding_completed_at == null;
  }
);
