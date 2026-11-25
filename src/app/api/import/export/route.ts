import { requireAdminApiAccess } from "@/features/auth/admin-api";
import { buildExportCsvFromData } from "@/features/import/csv-template";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await requireAdminApiAccess();
  if ("response" in access) return access.response;
  const { profile } = access;

  const supabase = await createClient();

  const customerColumns =
    "id, owner_name, phone, email, address, secondary_owner_name, secondary_phone, notes";
  const withBilling = await supabase
    .from("customers")
    .select(`${customerColumns}, billing_email`)
    .eq("company_id", profile.company_id)
    .order("owner_name");
  const customers = withBilling.error
    ? (
        await supabase
          .from("customers")
          .select(customerColumns)
          .eq("company_id", profile.company_id)
          .order("owner_name")
      ).data
    : withBilling.data;

  const { data: dogs } = await supabase
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
    .order("name");

  const csv = buildExportCsvFromData(customers ?? [], dogs ?? []);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="packroute-customers-dogs.csv"',
    },
  });
}
