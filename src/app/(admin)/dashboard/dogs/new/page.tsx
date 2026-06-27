import { PageHeader, BackLink } from "@/features/admin/components/ui";
import { DogForm } from "@/features/dogs/components/dog-form";
import { requireRole } from "@/features/auth/queries";
import { listRoutes } from "@/features/routes/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NewDogPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const [{ data: customers }, routes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, owner_name")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("owner_name"),
    listRoutes(profile.company_id),
  ]);

  return (
    <div>
      <BackLink href="/dashboard/dogs">Back to dogs</BackLink>
      <PageHeader title="Add dog" />
      <DogForm customers={customers ?? []} routes={routes} />
    </div>
  );
}
