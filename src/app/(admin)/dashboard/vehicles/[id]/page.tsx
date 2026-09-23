import { notFound } from "next/navigation";
import { BackLink, PageHeader } from "@/features/admin/components/ui";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("vehicles")
    .select("id, company_id, name, plate, capacity, is_active, created_at, updated_at")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!data) notFound();

  const vehicle = data as Vehicle;

  return (
    <div>
      <BackLink href="/dashboard/vehicles">Back to vehicles</BackLink>
      <PageHeader title="Edit vehicle" description={vehicle.name} />
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
