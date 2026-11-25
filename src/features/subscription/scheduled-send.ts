import { canAccessApplication } from "@/features/subscription/helpers";
import type { SubscriptionLike } from "@/features/subscription/types";

export type ScheduledSendSkip =
  | "no_subscription"
  | "subscription_inactive"
  | "no_customers";

/** Whether a scheduled sender (night-before) may text this company. */
export function scheduledSendSkipReason(input: {
  subscription: SubscriptionLike | null;
  activeCustomerCount: number;
  now?: Date;
}): ScheduledSendSkip | null {
  if (!input.subscription) return "no_subscription";
  if (!canAccessApplication(input.subscription, input.now)) {
    return "subscription_inactive";
  }
  if (input.activeCustomerCount <= 0) return "no_customers";
  return null;
}
