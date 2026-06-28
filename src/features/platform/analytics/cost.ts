import type { PlatformCostAssumptions } from "@/features/platform/analytics/types";

export const DEFAULT_COST_ASSUMPTIONS: Omit<
  PlatformCostAssumptions,
  "id" | "updated_at"
> = {
  sms_outbound_usd: 0.0079,
  sms_inbound_usd: 0.0079,
  eta_calculation_usd: 0.005,
  geocode_usd: 0.005,
  base_infra_per_company_usd: 2,
  supabase_platform_usd: 25,
  netlify_platform_usd: 19,
};

export type UsageCounts = {
  smsOutbound: number;
  smsInbound: number;
  smsFailed: number;
  etaCalculations: number;
};

export function estimateCompanyCostUsd(
  counts: UsageCounts,
  assumptions: PlatformCostAssumptions,
  companyCount: number
): number {
  const sharedInfra =
    companyCount > 0
      ? (assumptions.supabase_platform_usd + assumptions.netlify_platform_usd) /
        companyCount
      : 0;

  return (
    counts.smsOutbound * assumptions.sms_outbound_usd +
    counts.smsInbound * assumptions.sms_inbound_usd +
    counts.etaCalculations * assumptions.eta_calculation_usd +
    assumptions.base_infra_per_company_usd +
    sharedInfra
  );
}

export function estimateRevenueUsd(monthlySubscriptionCents: number): number {
  return monthlySubscriptionCents / 100;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
