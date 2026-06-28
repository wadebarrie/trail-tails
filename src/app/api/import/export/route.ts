import { canAccessAdmin } from "@/features/auth/access";
import { getCurrentProfile } from "@/features/auth/queries";
import { buildExportCsvFromData } from "@/features/import/csv-template";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile?.is_active || !canAccessAdmin(profile)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();

  const [{ data: customers }, { data: dogs }] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, owner_name, phone, email, address, secondary_owner_name, secondary_phone, notes"
      )
      .eq("company_id", profile.company_id)
      .order("owner_name"),
    supabase
      .from("dogs")
      .select(
        `
        id,
        customer_id,
        name,
        breed,
        notes,
        pickup_window_start,
        pickup_window_end,
        hike_rate_cents,
        routes ( name ),
        dog_schedule_days ( day_of_week )
      `
      )
      .eq("company_id", profile.company_id)
      .order("name"),
  ]);

  const csv = buildExportCsvFromData(customers ?? [], dogs ?? []);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="packroute-customers-dogs.csv"',
    },
  });
}
