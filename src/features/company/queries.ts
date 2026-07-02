import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCompanyTimezone = cache(async (companyId: string): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  return data?.timezone ?? "America/Los_Angeles";
});

export async function getCompanyName(companyId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();

  if (error || !data) return null;
  return data.name;
}
