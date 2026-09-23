import {
  PAID_TIER_CATALOG,
  type PaidTierId,
  type StripePriceCatalogEntry,
} from "@/features/subscription/paid-tiers";
import type { BillingInterval } from "@/features/subscription/types";

export type { PaidTierId, StripePriceCatalogEntry };
export { PAID_TIER_CATALOG };

const TIER_BY_ID = new Map(
  PAID_TIER_CATALOG.map((entry) => [entry.tierId, entry] as const)
);

function envPriceId(tierId: PaidTierId, interval: BillingInterval): string | null {
  const key =
    interval === "yearly"
      ? ({
          one_hiker: "STRIPE_PRICE_ONE_HIKER_YEARLY",
          two_hikers: "STRIPE_PRICE_TWO_HIKERS_YEARLY",
          three_plus: "STRIPE_PRICE_THREE_PLUS_YEARLY",
        } as const)[tierId]
      : ({
          one_hiker: "STRIPE_PRICE_ONE_HIKER",
          two_hikers: "STRIPE_PRICE_TWO_HIKERS",
          three_plus: "STRIPE_PRICE_THREE_PLUS",
        } as const)[tierId];

  return process.env[key]?.trim() || null;
}

export function getPaidTier(tierId: string): StripePriceCatalogEntry | null {
  return TIER_BY_ID.get(tierId as PaidTierId) ?? null;
}

export function getStripePriceId(
  tierId: PaidTierId,
  interval: BillingInterval = "monthly"
): string | null {
  return envPriceId(tierId, interval);
}

export function resolveTierFromStripePriceId(
  priceId: string | null | undefined
): StripePriceCatalogEntry | null {
  if (!priceId) return null;

  for (const entry of PAID_TIER_CATALOG) {
    if (getStripePriceId(entry.tierId, "monthly") === priceId) return entry;
    if (getStripePriceId(entry.tierId, "yearly") === priceId) return entry;
  }
  return null;
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function areStripePricesConfigured(
  interval: BillingInterval = "monthly"
): boolean {
  return PAID_TIER_CATALOG.every((entry) =>
    Boolean(getStripePriceId(entry.tierId, interval))
  );
}
