import { PageHeader, BackLink } from "@/features/admin/components/ui";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { requireRole } from "@/features/auth/queries";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { safeAppReturnPath } from "@/lib/safe-return-path";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  await requireRole("admin");
  const { returnTo: rawReturn } = await searchParams;
  const returnTo = rawReturn
    ? safeAppReturnPath(rawReturn, ONBOARDING_PATH)
    : undefined;

  return (
    <div>
      <BackLink href={returnTo ?? "/dashboard/customers"}>
        {returnTo ? "Back to setup" : "Back to customers"}
      </BackLink>
      <PageHeader title="Add customer" />
      <CustomerForm returnTo={returnTo} />
    </div>
  );
}
