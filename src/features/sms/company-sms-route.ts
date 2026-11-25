import { createServiceClient } from "@/lib/supabase/service";
import { getDateInTimezone, getUtcBoundsForLocalDate } from "@/lib/dates";
import { phoneMatchKey } from "@/lib/phone";
import { getSmsRedirectTo } from "@/lib/twilio";
import {
  companyOutboundTarget,
  trialOutboundCapReached,
  type SmsMode,
} from "@/features/sms/sms-policy";

export type CompanyOutboundPlan = {
  redirectTo: string | null;
  blocked: "test_phone_missing" | "trial_cap" | null;
  smsMode: SmsMode;
  sentToday: number;
};

export async function loadCompanyOutboundPlan(
  companyId: string
): Promise<CompanyOutboundPlan> {
  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from("companies")
    .select("timezone, sms_mode, sms_test_phone")
    .eq("id", companyId)
    .maybeSingle();

  const smsMode: SmsMode = company?.sms_mode === "test" ? "test" : "live";
  const target = companyOutboundTarget({
    smsMode,
    smsTestPhone: company?.sms_test_phone ?? null,
    globalRedirect: getSmsRedirectTo(),
  });

  if (target.blocked) {
    return {
      redirectTo: null,
      blocked: "test_phone_missing",
      smsMode,
      sentToday: 0,
    };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("company_id", companyId)
    .maybeSingle();

  if (subscription?.status !== "trial") {
    return {
      redirectTo: target.redirectTo,
      blocked: null,
      smsMode,
      sentToday: 0,
    };
  }

  const timeZone = company?.timezone ?? "America/Vancouver";
  const today = getDateInTimezone(timeZone, 0);
  const bounds = getUtcBoundsForLocalDate(timeZone, today);
  const { count } = await supabase
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("direction", "outbound")
    .gte("created_at", bounds.startIso)
    .lt("created_at", bounds.endIso);

  const sentToday = count ?? 0;
  if (trialOutboundCapReached(sentToday)) {
    return {
      redirectTo: target.redirectTo,
      blocked: "trial_cap",
      smsMode,
      sentToday,
    };
  }

  return { redirectTo: target.redirectTo, blocked: null, smsMode, sentToday };
}

export async function latestOutboundCompanyId(
  fromNumber: string
): Promise<string | null> {
  const key = phoneMatchKey(fromNumber);
  if (!key) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sms_messages")
    .select("company_id")
    .eq("direction", "outbound")
    .eq("to_phone_key", key)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.company_id) return null;
  return data.company_id;
}
