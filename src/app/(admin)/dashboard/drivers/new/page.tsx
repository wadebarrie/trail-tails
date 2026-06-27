import { BackLink, PageHeader } from "@/features/admin/components/ui";
import { DriverForm } from "@/features/drivers/components/driver-form";
import { requireRole } from "@/features/auth/queries";

export default async function NewDriverPage() {
  await requireRole("admin");

  return (
    <div>
      <BackLink href="/dashboard/drivers">Back to drivers</BackLink>
      <PageHeader
        title="Add driver"
        description="Creates a login for the driver mobile app."
      />
      <DriverForm />
    </div>
  );
}
