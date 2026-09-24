import type { PricingTierId } from "@/features/landing/pricing-tiers";
import type { SubscriptionPlan } from "@/features/subscription/types";

export type PaidTierId = PricingTierId;

export type StripePriceCatalogEntry = {
  tierId: PaidTierId;
  plan: SubscriptionPlan;
  /** Display / stored monthly list price in USD (yearly is 10× monthly). */
  monthlyPriceUsd: number;
  name: string;
  hikers: string;
  dogs: string;
  highlight?: boolean;
  badge?: string;
};

/** Canonical paid tiers — safe for client bundles (no env secrets). */
export const PAID_TIER_CATALOG: readonly StripePriceCatalogEntry[] = [
  {
    tierId: "one_hiker",
    plan: "one_hiker",
    monthlyPriceUsd: 29,
    name: "One driver",
    hikers: "1 driver on the road",
    dogs: "Up to 40 active dogs a week",
  },
  {
    tierId: "two_hikers",
    plan: "two_hikers",
    monthlyPriceUsd: 49,
    name: "Two drivers",
    hikers: "2 drivers",
    dogs: "Up to 120 active dogs a week",
    highlight: true,
    badge: "Most common",
  },
  {
    tierId: "three_plus",
    plan: "three_plus",
    monthlyPriceUsd: 79,
    name: "Three+ drivers",
    hikers: "3+ drivers, multi-route mornings",
    dogs: "Unlimited dogs",
  },
] as const;
