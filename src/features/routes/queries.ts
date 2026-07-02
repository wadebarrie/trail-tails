import { createClient } from "@/lib/supabase/server";
import type { Route } from "@/types";

export type RouteWithSchedule = Route & {
  route_schedule_days: { day_of_week: number }[];
};

export async function listRoutes(companyId: string): Promise<RouteWithSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select(
      "id, company_id, name, sort_order, period, default_driver_id, created_at, updated_at, route_schedule_days ( day_of_week )"
    )
    .eq("company_id", companyId)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as RouteWithSchedule[];
}

export function getRouteScheduleDays(route: RouteWithSchedule): number[] {
  return (route.route_schedule_days ?? []).map((d) => d.day_of_week);
}
