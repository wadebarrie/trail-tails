import { PageHeader, BackLink } from "@/features/admin/components/ui";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { requireRole } from "@/features/auth/queries";

export default async function NewCustomerPage() {
  await requireRole("admin");

  return (
    <div>
      <BackLink href="/dashboard/customers">Back to customers</BackLink>
      <PageHeader title="Add customer" />
      <CustomerForm />
    </div>
  );
}
