import { PageHeader } from "@/features/admin/components/ui";
import { CompanySettingsForm } from "@/features/company/components/company-settings-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name, default_hike_rate_cents")
    .eq("id", profile.company_id)
    .single();

  return (
    <div>
      <PageHeader
        title="Settings"
        description={company?.name ?? "Company settings"}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-stone-900">Billing</h2>
        <p className="mt-1 text-sm text-stone-600">
          Set the default price charged per completed hike day.
        </p>
        <div className="mt-4">
          <CompanySettingsForm
            defaultRateCents={company?.default_hike_rate_cents ?? null}
          />
        </div>
      </section>
    </div>
  );
}
