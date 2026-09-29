import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  parseRouteCadence,
  type RouteCadence,
} from "@/features/company/route-cadence";

export const getCompanyTimezone = cache(async (companyId: string): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();

  return data?.timezone ?? "America/Vancouver";
});

export const getCompanyName = cache(
  async (companyId: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    if (error || !data) return null;
    return data.name;
  }
);

export const getCompanyRouteCadence = cache(
  async (companyId: string): Promise<RouteCadence> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("route_cadence")
      .eq("id", companyId)
      .maybeSingle();

    return parseRouteCadence(data?.route_cadence);
  }
);
