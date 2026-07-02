import type { SubscriptionStatus } from "@/features/subscription/types";

/**
 * Map Stripe subscription status strings to application subscription statuses.
 * Stripe names are an implementation detail — the app uses its own status model.
 */
export function mapStripeSubscriptionStatus(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "paused":
      return "paused";
    case "incomplete":
    case "incomplete_expired":
      return "inactive";
    default:
      return "inactive";
  }
}

export function stripeUnixToIso(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds == null) return null;
  return new Date(unixSeconds * 1000).toISOString();
}
