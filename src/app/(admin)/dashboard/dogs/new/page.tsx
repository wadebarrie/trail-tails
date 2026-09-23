import { PageHeader, BackLink } from "@/features/admin/components/ui";
import { DogForm } from "@/features/dogs/components/dog-form";
import { requireRole } from "@/features/auth/queries";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { listRoutes } from "@/features/routes/queries";
import { createClient } from "@/lib/supabase/server";
import { safeAppReturnPath } from "@/lib/safe-return-path";

export default async function NewDogPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { returnTo: rawReturn } = await searchParams;
  const returnTo = rawReturn
    ? safeAppReturnPath(rawReturn, ONBOARDING_PATH)
    : undefined;

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
      <BackLink href={returnTo ?? "/dashboard/dogs"}>
        {returnTo ? "Back to setup" : "Back to dogs"}
      </BackLink>
      <PageHeader title="Add dog" />
      <DogForm
        customers={customers ?? []}
        routes={routes}
        returnTo={returnTo}
      />
    </div>
  );
}
