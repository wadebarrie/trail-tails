import {
  canAccessApplication,
  daysRemainingInTrial,
  isActive,
  isCancelled,
  isInactive,
  isPastDue,
  isPaused,
  isTrial,
  trialHasExpired,
} from "@/features/subscription/helpers";
import type { SubscriptionLike } from "@/features/subscription/types";

type Case = {
  name: string;
  pass: boolean;
};

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const now = new Date("2026-07-10T12:00:00.000Z");

function trialSubscription(overrides: Partial<SubscriptionLike> = {}): SubscriptionLike {
  return {
    status: "trial",
    trial_starts_at: "2026-07-01T00:00:00.000Z",
    trial_ends_at: "2026-07-31T00:00:00.000Z",
    ...overrides,
  };
}

const cases: Case[] = [
  assert("isTrial", isTrial(trialSubscription())),
  assert("isActive for active status", isActive({ ...trialSubscription(), status: "active" })),
  assert("isCancelled", isCancelled({ ...trialSubscription(), status: "cancelled" })),
  assert("isPastDue", isPastDue({ ...trialSubscription(), status: "past_due" })),
  assert("isPaused", isPaused({ ...trialSubscription(), status: "paused" })),
  assert("isInactive", isInactive({ ...trialSubscription(), status: "inactive" })),
  assert(
    "canAccessApplication allows trial",
    canAccessApplication(trialSubscription(), now)
  ),
  assert(
    "canAccessApplication allows active",
    canAccessApplication({ ...trialSubscription(), status: "active" }, now)
  ),
  assert(
    "canAccessApplication blocks cancelled",
    !canAccessApplication({ ...trialSubscription(), status: "cancelled" }, now)
  ),
  assert(
    "daysRemainingInTrial",
    daysRemainingInTrial(trialSubscription(), now) === 21
  ),
  assert(
    "daysRemainingInTrial null when not trial",
    daysRemainingInTrial({ ...trialSubscription(), status: "active" }, now) === null
  ),
  assert(
    "trialHasExpired when past end",
    trialHasExpired(trialSubscription(), new Date("2026-08-01T00:00:00.000Z"))
  ),
  assert(
    "canAccessApplication blocks expired trial",
    !canAccessApplication(trialSubscription(), new Date("2026-08-01T00:00:00.000Z"))
  ),
  assert(
    "trialHasExpired false before end",
    !trialHasExpired(trialSubscription(), now)
  ),
];

const failed = cases.filter((c) => !c.pass);

if (failed.length > 0) {
  console.error("Subscription helper tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} subscription helper tests passed.`);
