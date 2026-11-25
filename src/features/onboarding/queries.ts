import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { readOnboardingGate } from "@/features/onboarding/gate";
import { onboardingStillRequired } from "@/features/onboarding/first-value";
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
      welcome,
      vehicles,
      drivers,
      customers,
      dogs,
      routes,
      dogsOnRoute,
      shares,
      invoices,
    ] = await Promise.all([
      supabase
        .from("companies")
        .select("onboarding_completed_at, default_hike_rate_cents")
        .eq("id", companyId)
        .maybeSingle(),
      supabase
        .from("companies")
        .select(
          "onboarding_dismissed_at, onboarding_welcome_at, onboarding_sample_text_at, outing_style"
        )
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
      supabase
        .from("hike_photo_shares")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .is("revoked_at", null),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
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
      welcomeSaved: !welcome.error && Boolean(welcome.data?.onboarding_welcome_at),
      hasSampleText:
        !welcome.error && Boolean(welcome.data?.onboarding_sample_text_at),
      hasGallery: (shares.count ?? 0) > 0,
      hasDraftInvoice: (invoices.count ?? 0) > 0,
      completedAt: company?.onboarding_completed_at ?? null,
      dismissedAt: welcome.error
        ? null
        : (welcome.data?.onboarding_dismissed_at ?? null),
      outingStyle:
        welcome.data?.outing_style === "walk" || welcome.data?.outing_style === "hike"
          ? welcome.data.outing_style
          : null,
    };
  }
);

/** Cheap gate for redirects — avoids the full onboarding progress fan-out. */
export const companyNeedsOnboarding = cache(
  async (companyId: string): Promise<boolean> => {
    const supabase = await createClient();
    const gate = await readOnboardingGate(supabase, companyId);
    return onboardingStillRequired(gate);
  }
);
