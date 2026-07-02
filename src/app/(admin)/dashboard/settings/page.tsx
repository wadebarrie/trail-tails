import { PageHeader } from "@/features/admin/components/ui";
import { CompanySettingsForm } from "@/features/company/components/company-settings-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NIGHT_BEFORE_REMINDER_TIME = "19:30:00";

export default async function SettingsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name, default_hike_rate_cents, night_before_reminder_time")
    .eq("id", profile.company_id)
    .single();

  return (
    <div>
      <PageHeader
        title="Settings"
        description={company?.name ?? "Company settings"}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <CompanySettingsForm
          defaultRateCents={company?.default_hike_rate_cents ?? null}
          defaultNightBeforeReminderTime={
            company?.night_before_reminder_time ??
            DEFAULT_NIGHT_BEFORE_REMINDER_TIME
          }
        />
      </section>
    </div>
  );
}
