import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";

export type AdminSearchHit = {
  type: "customer" | "dog";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

function sanitizeSearchQuery(value: string) {
  return value.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

/** Global admin search — customers and dogs by name/phone/address. */
export async function searchAdminEntities(
  query: string,
  limit = 8
): Promise<AdminSearchHit[]> {
  const profile = await requireRole("admin");
  const q = sanitizeSearchQuery(query);
  if (q.length < 2) return [];

  const pattern = `%${q}%`;
  const supabase = await createClient();
  const perType = Math.max(3, Math.ceil(limit / 2));

  const [customersRes, dogsRes] = await Promise.all([
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

  return hits.slice(0, limit);
}
