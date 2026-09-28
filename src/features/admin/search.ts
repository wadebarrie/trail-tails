import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { vehicleDisplayLabel } from "@/features/vehicles/schema";

export type AdminSearchHit = {
  type: "customer" | "dog" | "driver" | "vehicle" | "route";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

function sanitizeSearchQuery(value: string) {
  return value.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

/** Global admin search — customers, dogs, drivers, vehicles, and routes. */
export async function searchAdminEntities(
  query: string,
  limit = 10
): Promise<AdminSearchHit[]> {
  const profile = await requireRole("admin");
  const q = sanitizeSearchQuery(query);
  if (q.length < 2) return [];

  const pattern = `%${q}%`;
  const supabase = await createClient();
  const perType = Math.max(2, Math.ceil(limit / 4));

  const [customersRes, dogsRes, driversRes, vehiclesRes, routesRes] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, owner_name, phone, address")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .or(
          `owner_name.ilike."${pattern}",phone.ilike."${pattern}",secondary_owner_name.ilike."${pattern}",address.ilike."${pattern}"`
        )
        .order("owner_name")
        .limit(perType),
      supabase
        .from("dogs")
        .select("id, name, customers ( owner_name )")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .ilike("name", pattern)
        .order("name")
        .limit(perType),
      supabase
        .from("profiles")
        .select("id, full_name, phone, role, can_drive")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .or("role.eq.driver,and(role.eq.admin,can_drive.eq.true)")
        .ilike("full_name", pattern)
        .order("full_name")
        .limit(perType),
      supabase
        .from("vehicles")
        .select("id, name, plate, is_active")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .or(`name.ilike."${pattern}",plate.ilike."${pattern}"`)
        .order("name")
        .limit(perType),
      supabase
        .from("routes")
        .select("id, name, period")
        .eq("company_id", profile.company_id)
        .ilike("name", pattern)
        .order("name")
        .limit(perType),
    ]);

  const hits: AdminSearchHit[] = [];

  for (const row of customersRes.data ?? []) {
    hits.push({
      type: "customer",
      id: row.id,
      title: row.owner_name,
      subtitle: [row.phone, row.address].filter(Boolean).join(" · "),
      href: `/dashboard/customers/${row.id}`,
    });
  }

  for (const row of dogsRes.data ?? []) {
    const customers = row.customers as
      | { owner_name: string }
      | { owner_name: string }[]
      | null;
    const owner = Array.isArray(customers)
      ? customers[0]?.owner_name
      : customers?.owner_name;
    hits.push({
      type: "dog",
      id: row.id,
      title: row.name,
      subtitle: owner ? `Dog · ${owner}` : "Dog",
      href: `/dashboard/dogs/${row.id}`,
    });
  }

  for (const row of driversRes.data ?? []) {
    hits.push({
      type: "driver",
      id: row.id,
      title: row.full_name,
      subtitle: [
        row.role === "admin" ? "Admin + driver" : "Driver",
        row.phone,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/dashboard/drivers/${row.id}`,
    });
  }

  for (const row of vehiclesRes.data ?? []) {
    hits.push({
      type: "vehicle",
      id: row.id,
      title: vehicleDisplayLabel(row),
      subtitle: "Vehicle",
      href: `/dashboard/vehicles/${row.id}`,
    });
  }

  for (const row of routesRes.data ?? []) {
    const period =
      row.period === "afternoon"
        ? "Afternoon"
        : row.period === "morning"
          ? "Morning"
          : row.period;
    hits.push({
      type: "route",
      id: row.id,
      title: row.name,
      subtitle: period ? `Route · ${period}` : "Route",
      href: "/dashboard/route",
    });
  }

  return hits.slice(0, limit);
}
