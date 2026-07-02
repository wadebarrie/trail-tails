import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformOwner } from "@/features/platform/queries";
import type { CaseStudyStatus } from "@/features/platform/analytics/types";

export type CompanyFounderProfile = {
  companyId: string;
  internalNotes: string | null;
  followUpDate: string | null;
  caseStudyStatus: CaseStudyStatus;
  customerQuote: string | null;
};

export async function listFounderProfiles(): Promise<Map<string, CompanyFounderProfile>> {
  await requirePlatformOwner();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("company_founder_profiles").select("*");

  if (error) throw new Error(error.message);

  const map = new Map<string, CompanyFounderProfile>();
  for (const row of data ?? []) {
    map.set(row.company_id, {
      companyId: row.company_id,
      internalNotes: row.internal_notes,
      followUpDate: row.follow_up_date,
      caseStudyStatus: row.case_study_status as CaseStudyStatus,
      customerQuote: row.customer_quote,
    });
  }
  return map;
}

export async function getFounderProfile(
  companyId: string
): Promise<CompanyFounderProfile | null> {
  await requirePlatformOwner();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("company_founder_profiles")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    companyId: data.company_id,
    internalNotes: data.internal_notes,
    followUpDate: data.follow_up_date,
    caseStudyStatus: data.case_study_status as CaseStudyStatus,
    customerQuote: data.customer_quote,
  };
}
