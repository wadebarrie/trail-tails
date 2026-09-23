import { BackLink, PageHeader } from "@/features/admin/components/ui";
import { DriverForm } from "@/features/drivers/components/driver-form";
import { requireRole } from "@/features/auth/queries";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { safeAppReturnPath } from "@/lib/safe-return-path";

export default async function NewDriverPage({
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
      <BackLink href={returnTo ?? "/dashboard/drivers"}>
        {returnTo ? "Back to setup" : "Back to drivers"}
      </BackLink>
      <PageHeader
        title="Add driver"
        description="Creates a login for the driver mobile app."
      />
      <DriverForm returnTo={returnTo} />
    </div>
  );
}
