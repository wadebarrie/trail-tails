/** Shared public + billing tier ids (pricing page may import these). */

export type PricingTierId = "one_hiker" | "two_hikers" | "three_plus";

export const PRICING_TIER_IDS = [
  "one_hiker",
  "two_hikers",
  "three_plus",
] as const satisfies readonly PricingTierId[];
