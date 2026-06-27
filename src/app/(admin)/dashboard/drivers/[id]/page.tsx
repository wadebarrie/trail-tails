import { notFound } from "next/navigation";
import { BackLink, PageHeader } from "@/features/admin/components/ui";
import { getDriverEmail } from "@/features/drivers/actions";
import { DriverForm } from "@/features/drivers/components/driver-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, is_active, role")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .maybeSingle();

  if (!data) notFound();

  const driver = data as Pick<
    Profile,
    "id" | "full_name" | "phone" | "is_active"
  >;
  const email = await getDriverEmail(id);

  return (
    <div>
      <BackLink href="/dashboard/drivers">Back to drivers</BackLink>
      <PageHeader title="Edit driver" description={driver.full_name} />
      <DriverForm driver={driver} email={email} />
    </div>
  );
}
