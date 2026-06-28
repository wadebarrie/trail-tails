import { createClient } from "@/lib/supabase/server";

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
