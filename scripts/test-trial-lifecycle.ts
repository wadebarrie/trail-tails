import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scheduledSendSkipReason } from "@/features/subscription/scheduled-send";
import {
  formatTrialEndDate,
  trialClockUpdate,
  trialStatusChip,
} from "@/features/subscription/trial-clock";
import { buildWelcomeEmail } from "@/features/subscription/welcome-email";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const now = new Date("2026-07-10T12:00:00.000Z");
const liveTrial = {
  status: "trial" as const,
  trial_starts_at: "2026-07-01T00:00:00.000Z",
  trial_ends_at: "2026-08-01T00:00:00.000Z",
};
const expiredTrial = {
  ...liveTrial,
  trial_ends_at: "2026-07-01T00:00:00.000Z",
};

const migration = readFileSync(
  resolve("supabase/migrations/20261125160000_trial_currency_cad.sql"),
  "utf8"
);
const clock = trialClockUpdate(now);
const welcome = buildWelcomeEmail({
  loginUrl: "https://packroute.app/login",
  helpUrl: "https://packroute.app/dashboard/help",
  trialEndsOn: "August 9, 2026",
});

const cases: Case[] = [
  assert(
    "expired trial sends no texts",
    scheduledSendSkipReason({
      subscription: expiredTrial,
      activeCustomerCount: 3,
      now,
    }) === "subscription_inactive"
  ),
  assert(
    "abandoned trial with no customers is skipped",
    scheduledSendSkipReason({
      subscription: liveTrial,
      activeCustomerCount: 0,
      now,
    }) === "no_customers"
  ),
  assert(
    "missing subscription is skipped",
    scheduledSendSkipReason({
      subscription: null,
      activeCustomerCount: 2,
      now,
    }) === "no_subscription"
  ),
  assert(
    "live trial with customers can be texted",
    scheduledSendSkipReason({
      subscription: liveTrial,
      activeCustomerCount: 1,
      now,
    }) === null
  ),
  assert(
    "cancelled company is skipped",
    scheduledSendSkipReason({
      subscription: { ...liveTrial, status: "cancelled" },
      activeCustomerCount: 4,
      now,
    }) === "subscription_inactive"
  ),
  assert(
    "new trial clock is CAD and 30 days",
    clock.billing_currency === "CAD" &&
      clock.monthly_price === 0 &&
      clock.status === "trial" &&
      clock.trial_starts_at === now.toISOString() &&
      new Date(clock.trial_ends_at).getTime() - now.getTime() ===
        30 * 86_400_000
  ),
  assert(
    "trial chip shows the end date countdown and plan link",
    trialStatusChip(12) === "Trial · 12 days left · Choose plan" &&
      trialStatusChip(1) === "Trial · 1 day left · Choose plan" &&
      trialStatusChip(null) === null &&
      trialStatusChip(-1) === null
  ),
  assert(
    "welcome email includes login, trial end, help, and a self-test",
    welcome.subject === "Welcome to PackRoute" &&
      welcome.text.includes("https://packroute.app/login") &&
      welcome.text.includes("August 9, 2026") &&
      welcome.text.includes("https://packroute.app/dashboard/help") &&
      welcome.text.includes("your own mobile number")
  ),
  assert(
    "trial end date formats in the company timezone",
    formatTrialEndDate("2026-08-09T18:00:00.000Z", "America/Vancouver") ===
      "August 9, 2026"
  ),
  assert(
    "migration backfills unpaid trials to CAD and leaves paid rows",
    migration.includes("SET DEFAULT 'CAD'") &&
      migration.includes("SET billing_currency = 'CAD'") &&
      migration.includes("status = 'trial'") &&
      migration.includes("monthly_price = 0") &&
      migration.includes("'CAD'")
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Trial lifecycle tests failed:");
  for (const item of failed) console.error(`  ✗ ${item.name}`);
  console.error("chip", trialStatusChip(12));
  console.error("date", formatTrialEndDate("2026-08-09T18:00:00.000Z", "America/Vancouver"));
  process.exit(1);
}

console.log(`All ${cases.length} trial lifecycle tests passed.`);
