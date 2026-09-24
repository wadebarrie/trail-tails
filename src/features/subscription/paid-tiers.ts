import type { PricingTierId } from "@/features/landing/pricing-tiers";
import type { SubscriptionPlan } from "@/features/subscription/types";

export type PaidTierId = PricingTierId;

export type StripePriceCatalogEntry = {
  tierId: PaidTierId;
  plan: SubscriptionPlan;
  /** Display / stored monthly list price (yearly is 10× monthly). */
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
    monthlyPriceUsd: 99,
    name: "One hiker",
    hikers: "1 hiker or walker on the road",
    dogs: "Up to 20 active dogs a week",
  },
  {
    tierId: "two_hikers",
    plan: "two_hikers",
    monthlyPriceUsd: 179,
    name: "Two hikers",
    hikers: "2 hikers or walkers",
    dogs: "Up to 40 active dogs a week",
    highlight: true,
    badge: "Most common",
  },
  {
    tierId: "three_plus",
    plan: "three_plus",
    monthlyPriceUsd: 299,
    name: "Three+ hikers",
    hikers: "3+ hikers or walkers, multi-route mornings",
    dogs: "Up to 70 active dogs a week",
  },
] as const;
