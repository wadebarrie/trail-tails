import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export const ONBOARDING_PATH = "/dashboard/onboarding";

export const ONBOARDING_STEPS = [
  "welcome",
  "customer",
  "dog",
  "route",
  "prices",
  "try",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

/** Older wizard urls land on the closest step in the new order. */
export const ONBOARDING_LEGACY_STEP_ALIASES: Record<string, OnboardingStepId> = {
  hiker: "customer",
  vehicle: "welcome",
  driver: "customer",
  company: "prices",
};

export type OnboardingRouteCadence = "once" | "twice";

export const ONBOARDING_ROUTE_CADENCE_KEY =
  "packroute.onboarding.routeCadence";

export type OnboardingPeriodChecklist = {
  /** Active PackRoute exists for this period. */
  created: boolean;
  /** That PackRoute has at least one schedule day. */
  hasScheduleDays: boolean;
  /** An active dog is assigned to a PackRoute in this period. */
  hasDogAssigned: boolean;
  /** created + schedule days + dog assigned. */
  ready: boolean;
};

export type OnboardingRouteChecklist = {
  /** At least one active PackRoute exists. */
  created: boolean;
  /** A PackRoute has at least one schedule day. */
  hasScheduleDays: boolean;
  /** At least one active dog is assigned to a PackRoute. */
  hasDogAssigned: boolean;
  morning: OnboardingPeriodChecklist;
  afternoon: OnboardingPeriodChecklist;
};

export type OnboardingProgress = {
  hasVehicle: boolean;
  hasDriver: boolean;
  hasCustomer: boolean;
  hasDog: boolean;
  /** True when one PackRoute can run (schedule days + assigned dog). */
  hasRoute: boolean;
  routeChecklist: OnboardingRouteChecklist;
  hasCompanyInfo: boolean;
  welcomeSaved: boolean;
  hasSampleText: boolean;
  hasGallery: boolean;
  hasDraftInvoice: boolean;
  completedAt: string | null;
  dismissedAt: string | null;
  outingStyle: "walk" | "hike" | null;
};

export { nextIncompleteStep, isFirstValueReady as isOnboardingComplete } from "@/features/onboarding/first-value";

export function onboardingStepLabel(step: OnboardingStepId): string {
  switch (step) {
    case "welcome":
      return "Welcome";
    case "customer":
      return "Customer";
    case "dog":
      return "Dog";
    case "route":
      return "Route";
    case "prices":
      return "Prices";
    case "try":
      return "Try it";
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
