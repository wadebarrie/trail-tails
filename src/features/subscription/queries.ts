import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Subscription, SubscriptionSummary } from "@/features/subscription/types";

const SUBSCRIPTION_SUMMARY_COLUMNS =
  "plan, status, trial_starts_at, trial_ends_at, monthly_price, billing_currency, billing_interval, grandfathered, current_period_start, current_period_end, cancelled_at";

export const getSubscriptionForCompany = cache(
  async (companyId: string): Promise<Subscription | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Subscription | null) ?? null;
  }
);

export async function getSubscriptionSummaryForCompany(
  companyId: string
): Promise<SubscriptionSummary | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(SUBSCRIPTION_SUMMARY_COLUMNS)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as SubscriptionSummary | null) ?? null;
}

export async function listSubscriptionSummariesByCompanyIds(
  companyIds: string[]
): Promise<Map<string, SubscriptionSummary>> {
  if (companyIds.length === 0) return new Map();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`company_id, ${SUBSCRIPTION_SUMMARY_COLUMNS}`)
    .in("company_id", companyIds);

  if (error) throw new Error(error.message);

  const map = new Map<string, SubscriptionSummary>();
  for (const row of data ?? []) {
    const { company_id, ...summary } = row as SubscriptionSummary & {
      company_id: string;
    };
    map.set(company_id, summary);
  }
  return map;
}
