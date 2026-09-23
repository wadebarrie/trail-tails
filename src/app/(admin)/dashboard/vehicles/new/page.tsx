import { BackLink, PageHeader } from "@/features/admin/components/ui";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { requireRole } from "@/features/auth/queries";

export default async function NewVehiclePage() {
  await requireRole("admin");

  return (
    <div>
      <BackLink href="/dashboard/vehicles">Back to vehicles</BackLink>
      <PageHeader
        title="Add vehicle"
        description="Give it a name hikers will recognize in the yard."
      />
      <VehicleForm />
    </div>
  );
}
