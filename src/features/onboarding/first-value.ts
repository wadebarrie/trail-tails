import { formatTime } from "@/lib/dates";
import {
  nextIncompleteStep,
  type OnboardingProgress,
} from "@/features/onboarding/constants";

export { nextIncompleteStep };

export type OutingStyle = "walk" | "hike";
export type WizardSmsMode = "test" | "live";

/** Skip snoozes setup. Either timestamp means the login gate should not force the wizard. */
export function onboardingStillRequired(input: {
  completedAt: string | null | undefined;
  dismissedAt: string | null | undefined;
}): boolean {
  return !input.completedAt && !input.dismissedAt;
}

/** One route is enough. A second daily outing is optional and does not block setup. */
export function oneRouteIsEnough(input: {
  routeReady: boolean;
  morningReady: boolean;
  afternoonReady: boolean;
}): boolean {
  return input.routeReady;
}

export function sampleReminderPreview(input: {
  ownerName: string;
  dogName: string | null;
  windowStart?: string;
  windowEnd?: string;
}): string {
  const first = input.ownerName.trim().split(" ")[0] || "there";
  const dog = input.dogName?.trim() || "your dog";
  const start = formatTime(input.windowStart ?? "08:00");
  const end = formatTime(input.windowEnd ?? "08:30");
  return `Hi ${first}! ${dog} is booked for a hike tomorrow and will be picked up between ${start} and ${end}.`;
}

/** The sample text always goes to the owner, even when the company is live. */
export function sampleTextRecipient(ownerPhone: string): string {
  return ownerPhone.trim();
}

export function wizardSmsExplanation(mode: WizardSmsMode): string {
  if (mode === "test") {
    return "Texts are in test mode. They go to your mobile, not to customers, until you switch to live in Settings after customers have agreed.";
  }
  return "Texts are live for this company and go to each customer. Settings can switch this company to test mode so messages go to your mobile instead.";
}

export type FirstValueItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function firstValueChecklist(progress: OnboardingProgress): FirstValueItem[] {
  return [
    {
      id: "customer",
      label: "First customer",
      href: "/dashboard/onboarding?step=customer",
      done: progress.hasCustomer,
    },
    {
      id: "dog",
      label: "Dog",
      href: "/dashboard/onboarding?step=dog",
      done: progress.hasDog,
    },
    {
      id: "route",
      label: "One route",
      href: "/dashboard/onboarding?step=route",
      done: progress.hasRoute,
    },
    {
      id: "price",
      label: "Price (CA$)",
      href: "/dashboard/onboarding?step=prices",
      done: progress.hasCompanyInfo,
    },
    {
      id: "text",
      label: "Text to yourself",
      href: "/dashboard/onboarding?step=try",
      done: progress.hasSampleText,
    },
    {
      id: "gallery",
      label: "Photo gallery",
      href: "/dashboard/onboarding?step=try",
      done: progress.hasGallery,
    },
    {
      id: "invoice",
      label: "Draft invoice",
      href: "/dashboard/onboarding?step=try",
      done: progress.hasDraftInvoice,
    },
  ];
}
