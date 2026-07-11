import { PageHeader } from "@/features/admin/components/ui";
import { CostSettingsForm } from "@/features/platform/components/analytics/cost-settings-form";
import { SignupSettingsForm } from "@/features/platform/components/signup-settings-form";
import { getCostAssumptions } from "@/features/platform/analytics/queries";
import { getPlatformSettings } from "@/features/platform/settings";

export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const [assumptions, platformSettings] = await Promise.all([
    getCostAssumptions(),
    getPlatformSettings(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Platform settings"
        description="Onboarding controls and cost assumptions for platform analytics."
      />
      <SignupSettingsForm settings={platformSettings} />
      <CostSettingsForm assumptions={assumptions} />
    </div>
  );
}
