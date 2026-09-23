import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export const ONBOARDING_PATH = "/dashboard/onboarding";

export const ONBOARDING_STEPS = [
  "welcome",
  "vehicle",
  "hiker",
  "customer",
  "dog",
  "route",
  "company",
  "done",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export type OnboardingProgress = {
  hasVehicle: boolean;
  hasHiker: boolean;
  hasCustomer: boolean;
  hasDog: boolean;
  hasRoute: boolean;
  hasCompanyInfo: boolean;
  completedAt: string | null;
};

export function nextIncompleteStep(
  progress: OnboardingProgress
): OnboardingStepId {
  if (!progress.hasVehicle) return "vehicle";
  if (!progress.hasHiker) return "hiker";
  if (!progress.hasCustomer) return "customer";
  if (!progress.hasDog) return "dog";
  if (!progress.hasRoute) return "route";
  if (!progress.hasCompanyInfo) return "company";
  return "done";
}

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return (
    progress.hasVehicle &&
    progress.hasHiker &&
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
    case "hiker":
      return "Hiker";
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
