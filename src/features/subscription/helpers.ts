import { DEFAULT_TRIAL_DAYS } from "@/features/subscription/constants";
import type { SubscriptionLike } from "@/features/subscription/types";

const MS_PER_DAY = 86_400_000;

export function isTrial(subscription: SubscriptionLike): boolean {
  return subscription.status === "trial";
}

export function isActive(subscription: SubscriptionLike): boolean {
  return subscription.status === "active";
}

export function isCancelled(subscription: SubscriptionLike): boolean {
  return subscription.status === "cancelled";
}

export function isPastDue(subscription: SubscriptionLike): boolean {
  return subscription.status === "past_due";
}

export function isPaused(subscription: SubscriptionLike): boolean {
  return subscription.status === "paused";
}

export function isInactive(subscription: SubscriptionLike): boolean {
  return subscription.status === "inactive";
}

/** Trial and active subscriptions may use the app; others are redirected. */
export function canAccessApplication(subscription: SubscriptionLike): boolean {
  return isTrial(subscription) || isActive(subscription);
}

export function daysRemainingInTrial(
  subscription: SubscriptionLike,
  now = new Date()
): number | null {
  if (!isTrial(subscription) || !subscription.trial_ends_at) {
    return null;
  }

  return Math.ceil(
    (new Date(subscription.trial_ends_at).getTime() - now.getTime()) / MS_PER_DAY
  );
}

export function trialHasExpired(
  subscription: SubscriptionLike,
  now = new Date()
): boolean {
  const remaining = daysRemainingInTrial(subscription, now);
  return remaining !== null && remaining < 0;
}

/** Fixed trial window for new companies — dates stored, not computed at read time. */
export function defaultTrialWindow(from = new Date()): {
  trialStartsAt: string;
  trialEndsAt: string;
} {
  const trialStartsAt = from.toISOString();
  const trialEndsAt = new Date(
    from.getTime() + DEFAULT_TRIAL_DAYS * MS_PER_DAY
  ).toISOString();

  return { trialStartsAt, trialEndsAt };
}

export function subscriptionPlanLabel(plan: string): string {
  return plan
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function subscriptionStatusLabel(status: string): string {
  if (status === "past_due") return "Past due";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
