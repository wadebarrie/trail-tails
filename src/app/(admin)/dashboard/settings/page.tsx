import Link from "next/link";
import { PageHeader } from "@/features/admin/components/ui";
import { AccountingAddonsCard } from "@/features/billing/components/accounting-addons-card";
import { CompanySettingsForm } from "@/features/company/components/company-settings-form";
import { CompanyBillingCard } from "@/features/subscription/components/company-billing-card";
import { getSubscriptionForCompany } from "@/features/subscription/queries";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NIGHT_BEFORE_REMINDER_TIME = "19:30:00";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const profile = await requireRole("admin");
  const { tab } = await searchParams;
  const showBilling = tab === "billing";
  const supabase = await createClient();

  const [{ data: company }, subscription] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "name, timezone, route_cadence, default_hike_rate_cents, night_before_reminder_time"
      )
      .eq("id", profile.company_id)
      .single(),
    getSubscriptionForCompany(profile.company_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description={company?.name?.trim() ? company.name : "Company settings"}
      />

      {!company?.name?.trim() ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add your company name so the sidebar, drivers, and reports show the
          right business.
        </p>
      ) : null}

      <div className="mb-6 flex gap-2 text-sm">
        <Link
          href="/dashboard/settings"
          className={`rounded-full px-3 py-1.5 font-medium ${
            showBilling ? "bg-stone-100 text-stone-600" : "bg-[var(--color-trail-700)] text-white"
          }`}
          aria-current={showBilling ? undefined : "page"}
        >
          Operations
        </Link>
        <Link
          href="/dashboard/settings?tab=billing"
          className={`rounded-full px-3 py-1.5 font-medium ${
            showBilling ? "bg-[var(--color-trail-700)] text-white" : "bg-stone-100 text-stone-600"
          }`}
          aria-current={showBilling ? "page" : undefined}
        >
          Billing
        </Link>
      </div>

      {showBilling ? null : (
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <CompanySettingsForm
          companyName={company?.name ?? ""}
          timezone={company?.timezone ?? "America/Vancouver"}
          routeCadence={
            company?.route_cadence === "once" || company?.route_cadence === "twice"
              ? company.route_cadence
              : "twice"
          }
          defaultRateCents={company?.default_hike_rate_cents ?? null}
          defaultNightBeforeReminderTime={
            company?.night_before_reminder_time ??
            DEFAULT_NIGHT_BEFORE_REMINDER_TIME
          }
        />
      </section>
      )}

      {showBilling ? (
        <>
          <CompanyBillingCard subscription={subscription} />
          <AccountingAddonsCard />
        </>
      ) : null}
    </div>
  );
}
