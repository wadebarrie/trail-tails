import type { BillingCurrency } from "@/features/subscription/types";

export type PricingDisplayCurrency = Extract<BillingCurrency, "CAD" | "USD">;

/**
 * Canada-first: show CAD unless the visitor is clearly in the US.
 * Netlify / Cloudflare / Vercel geo headers when present.
 */
export function resolvePricingDisplayCurrency(
  requestHeaders: Headers,
  override?: string | null
): PricingDisplayCurrency {
  const normalized = override?.trim().toUpperCase();
  if (normalized === "CAD" || normalized === "USD") {
    return normalized;
  }

  const country = (
    requestHeaders.get("x-country") ??
    requestHeaders.get("x-nf-country-code") ??
    requestHeaders.get("cf-ipcountry") ??
    requestHeaders.get("x-vercel-ip-country") ??
    ""
  )
    .trim()
    .toUpperCase();

  if (country === "US") return "USD";
  return "CAD";
}
