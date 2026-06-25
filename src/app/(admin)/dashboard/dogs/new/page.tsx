import { PageHeader } from "@/features/admin/components/ui";
import { DogForm } from "@/features/dogs/components/dog-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NewDogPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, owner_name")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("owner_name");

  return (
    <div>
      <PageHeader title="Add dog" />
      <DogForm customers={customers ?? []} />
    </div>
  );
}
