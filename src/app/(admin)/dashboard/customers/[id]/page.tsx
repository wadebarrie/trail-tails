import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/components/ui";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!data) notFound();

  const customer = data as Customer;

  return (
    <div>
      <PageHeader title="Edit customer" description={customer.owner_name} />
      <CustomerForm customer={customer} />
    </div>
  );
}
