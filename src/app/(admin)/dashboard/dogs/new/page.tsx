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
  searchParams: Promise<{ returnTo?: string; customer_id?: string }>;
}) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { returnTo: rawReturn, customer_id: customerIdPrefill } =
    await searchParams;
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

  const backHref =
    returnTo ??
    (customerIdPrefill
      ? `/dashboard/customers/${customerIdPrefill}`
      : "/dashboard/dogs");

  return (
    <div>
      <BackLink href={backHref}>
        {returnTo
          ? "Back to setup"
          : customerIdPrefill
            ? "Back to customer"
            : "Back to dogs"}
      </BackLink>
      <PageHeader title="Add dog" />
      <DogForm
        customers={customers ?? []}
        routes={routes}
        returnTo={returnTo}
        defaultCustomerId={customerIdPrefill}
      />
    </div>
  );
}
