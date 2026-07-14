import type { SupabaseClient } from "@supabase/supabase-js";

type TenantCheck = { ok: true } | { ok: false; error: string };

async function rowInCompany(
  supabase: SupabaseClient,
  table: "customers" | "routes" | "dogs",
  id: string,
  companyId: string,
  label: string
): Promise<TenantCheck> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: `${label} not found in your company.` };
  }

  return { ok: true };
}

export function verifyCustomerInCompany(
  supabase: SupabaseClient,
  customerId: string,
  companyId: string
) {
  return rowInCompany(supabase, "customers", customerId, companyId, "Customer");
}

export function verifyRouteInCompany(
  supabase: SupabaseClient,
  routeId: string,
  companyId: string
) {
  return rowInCompany(supabase, "routes", routeId, companyId, "Route");
}

export function verifyDogInCompany(
  supabase: SupabaseClient,
  dogId: string,
  companyId: string
) {
  return rowInCompany(supabase, "dogs", dogId, companyId, "Dog");
}
