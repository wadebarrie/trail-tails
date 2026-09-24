import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export const ONBOARDING_PATH = "/dashboard/onboarding";

export const ONBOARDING_STEPS = [
  "welcome",
  "vehicle",
  "driver",
  "customer",
  "dog",
  "route",
  "company",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

/** Legacy step id from earlier onboarding copy — redirect to `driver`. */
export const ONBOARDING_LEGACY_STEP_ALIASES: Record<string, OnboardingStepId> = {
  hiker: "driver",
};

export type OnboardingRouteChecklist = {
  /** At least one active route exists. */
  created: boolean;
  /** A route has at least one schedule day. */
  hasScheduleDays: boolean;
  /** At least one active dog is assigned to a route. */
  hasDogAssigned: boolean;
};

export type OnboardingProgress = {
  hasVehicle: boolean;
  hasDriver: boolean;
  hasCustomer: boolean;
  hasDog: boolean;
  /** True when a route can actually run (schedule days + assigned dog). */
  hasRoute: boolean;
  routeChecklist: OnboardingRouteChecklist;
  hasCompanyInfo: boolean;
  completedAt: string | null;
};

export function nextIncompleteStep(
  progress: OnboardingProgress
): OnboardingStepId {
  if (!progress.hasVehicle) return "vehicle";
  if (!progress.hasDriver) return "driver";
  if (!progress.hasCustomer) return "customer";
  if (!progress.hasDog) return "dog";
  if (!progress.hasRoute) return "route";
  if (!progress.hasCompanyInfo) return "company";
  return "done";
}

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return (
    progress.hasVehicle &&
    progress.hasDriver &&
    progress.hasCustomer &&
    progress.hasDog &&
    progress.hasRoute &&
    progress.hasCompanyInfo
  );
}

export function onboardingStepLabel(step: OnboardingStepId): string {
  switch (step) {
    case "welcome":
      return "Welcome";
    case "vehicle":
      return "Vehicle";
    case "driver":
      return "Driver";
    case "customer":
      return "Customer";
    case "dog":
      return "Dog";
    case "route":
      return "Route";
    case "company":
      return "Company";
    case "done":
      return "Done";
  }
}

export const ONBOARDING_SUPPORT = {
  email: SITE_CONTACT_EMAIL,
  contactPath: "/contact",
  blurb:
    "Need a hand setting up? PackRoute support can walk you through onboarding — book a call or email anytime.",
} as const;
