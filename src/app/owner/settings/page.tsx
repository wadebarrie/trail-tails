import { PageHeader } from "@/features/admin/components/ui";
import { CostSettingsForm } from "@/features/platform/components/analytics/cost-settings-form";
import { getCostAssumptions } from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const assumptions = await getCostAssumptions();

  return (
    <div>
      <PageHeader
        title="Platform settings"
        description="Configure cost assumptions used for estimated COGS and margin calculations."
      />
      <CostSettingsForm assumptions={assumptions} />
    </div>
  );
}
