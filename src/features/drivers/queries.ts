import { createClient } from "@/lib/supabase/server";

export type AssignableDriver = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  role: "admin" | "driver";
  can_drive: boolean;
};

/** Active people who can be assigned to routes/hikes (drivers + admins who drive). */
export async function listAssignableDrivers(
  companyId: string,
  options?: { activeOnly?: boolean }
): Promise<AssignableDriver[]> {
  const supabase = await createClient();
  const activeOnly = options?.activeOnly ?? true;

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, is_active, role, can_drive")
    .eq("company_id", companyId)
    .or("role.eq.driver,and(role.eq.admin,can_drive.eq.true)")
    .order("full_name");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[drivers] listAssignableDrivers failed", error.message);
    return [];
  }

  return (data ?? []) as AssignableDriver[];
}
