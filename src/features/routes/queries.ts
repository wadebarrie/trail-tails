import { createClient } from "@/lib/supabase/server";
import type { Route } from "@/types";

export async function listRoutes(companyId: string): Promise<Route[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("id, company_id, name, sort_order, created_at, updated_at")
    .eq("company_id", companyId)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Route[];
}
