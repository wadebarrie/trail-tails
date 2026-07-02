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

function trialSubscription(overrides: Partial<SubscriptionLike> = {}): SubscriptionLike {
  return {
    status: "trial",
    trial_starts_at: "2026-01-01T00:00:00.000Z",
    trial_ends_at: "2026-01-31T00:00:00.000Z",
    ...overrides,
  };
}

const now = new Date("2026-01-15T12:00:00.000Z");

const cases: Case[] = [
  assert("isTrial", isTrial(trialSubscription())),
  assert("isActive for active status", isActive({ ...trialSubscription(), status: "active" })),
  assert("isCancelled", isCancelled({ ...trialSubscription(), status: "cancelled" })),
  assert("isPastDue", isPastDue({ ...trialSubscription(), status: "past_due" })),
  assert("isPaused", isPaused({ ...trialSubscription(), status: "paused" })),
  assert("isInactive", isInactive({ ...trialSubscription(), status: "inactive" })),
  assert(
    "canAccessApplication allows trial",
    canAccessApplication(trialSubscription())
  ),
  assert(
    "canAccessApplication allows active",
    canAccessApplication({ ...trialSubscription(), status: "active" })
  ),
  assert(
    "canAccessApplication blocks cancelled",
    !canAccessApplication({ ...trialSubscription(), status: "cancelled" })
  ),
  assert(
    "daysRemainingInTrial",
    daysRemainingInTrial(trialSubscription(), now) === 16
  ),
  assert(
    "daysRemainingInTrial null when not trial",
    daysRemainingInTrial({ ...trialSubscription(), status: "active" }, now) === null
  ),
  assert(
    "trialHasExpired when past end",
    trialHasExpired(trialSubscription(), new Date("2026-02-01T00:00:00.000Z"))
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
