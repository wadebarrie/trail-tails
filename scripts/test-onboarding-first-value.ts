import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { OnboardingProgress } from "@/features/onboarding/constants";
import {
  firstValueChecklist,
  nextIncompleteStep,
  onboardingStillRequired,
  oneRouteIsEnough,
  sampleReminderPreview,
  sampleTextRecipient,
  wizardSmsExplanation,
} from "@/features/onboarding/first-value";

function progress(overrides: Partial<OnboardingProgress> = {}): OnboardingProgress {
  return {
    hasVehicle: false,
    hasDriver: false,
    hasCustomer: false,
    hasDog: false,
    hasRoute: false,
    routeChecklist: {
      created: false,
      hasScheduleDays: false,
      hasDogAssigned: false,
      morning: {
        created: false,
        hasScheduleDays: false,
        hasDogAssigned: false,
        ready: false,
      },
      afternoon: {
        created: false,
        hasScheduleDays: false,
        hasDogAssigned: false,
        ready: false,
      },
    },
    hasCompanyInfo: false,
    welcomeSaved: false,
    hasSampleText: false,
    hasGallery: false,
    hasDraftInvoice: false,
    completedAt: null,
    dismissedAt: null,
    outingStyle: null,
    ...overrides,
  };
}

const migration = readFileSync(
  resolve("supabase/migrations/20261125180000_onboarding_dismiss.sql"),
  "utf8"
);
const wizard = readFileSync(
  resolve("src/features/onboarding/components/onboarding-wizard.tsx"),
  "utf8"
);
const invite = readFileSync(resolve("src/features/platform/actions.ts"), "utf8");
const smsLog = readFileSync(resolve("src/features/notifications/log.ts"), "utf8");

const cases: { name: string; pass: boolean }[] = [
  {
    name: "welcome comes before a vehicle",
    pass: nextIncompleteStep(progress()) === "welcome",
  },
  {
    name: "a saved welcome does not ask for a van",
    pass:
      nextIncompleteStep(progress({ welcomeSaved: true })) === "customer",
  },
  {
    name: "one ready route is enough when afternoons are empty",
    pass: oneRouteIsEnough({
      routeReady: true,
      morningReady: true,
      afternoonReady: false,
    }),
  },
  {
    name: "skip snoozes instead of finishing setup",
    pass:
      !onboardingStillRequired({
        completedAt: null,
        dismissedAt: "2026-11-25T00:00:00.000Z",
      }) &&
      onboardingStillRequired({ completedAt: null, dismissedAt: null }),
  },
  {
    name: "sample reminder names the dog",
    pass: sampleReminderPreview({
      ownerName: "Ada Owner",
      dogName: "Moss",
    }).includes("Moss"),
  },
  {
    name: "sample text goes to the owner, not the customer",
    pass:
      sampleTextRecipient("+16045550100") === "+16045550100" &&
      sampleTextRecipient("+16045550100") !== "+16045550999",
  },
  {
    name: "test mode and live mode are explained differently",
    pass:
      wizardSmsExplanation("test").includes("test mode") &&
      wizardSmsExplanation("live").includes("live") &&
      !wizardSmsExplanation("live").includes("They go to your mobile, not to customers"),
  },
  {
    name: "checklist stays until the gallery and invoice exist",
    pass: firstValueChecklist(
      progress({
        welcomeSaved: true,
        hasCustomer: true,
        hasDog: true,
        hasRoute: true,
        hasCompanyInfo: true,
        hasSampleText: true,
      })
    ).some((item) => item.id === "gallery" && !item.done),
  },
  {
    name: "migration adds columns and does not update existing rows",
    pass:
      migration.includes("onboarding_dismissed_at") &&
      !/\bUPDATE\b/i.test(migration) &&
      !/\bDELETE\b/i.test(migration),
  },
  {
    name: "wizard copy follows the company text mode",
    pass: wizard.includes("wizardSmsExplanation(smsMode)"),
  },
  {
    name: "admin invites start in test mode",
    pass: invite.includes('sms_mode: "test"') && invite.includes("sms_live_approved: false"),
  },
  {
    name: "trial cap skip is documented as a system log",
    pass: smsLog.includes("logWarn writes this warn row to system_logs"),
  },
];

const failed = cases.filter((item) => !item.pass);
if (failed.length) {
  console.error("Onboarding first-value tests failed:");
  for (const item of failed) console.error(`  ✗ ${item.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} onboarding first-value tests passed.`);
