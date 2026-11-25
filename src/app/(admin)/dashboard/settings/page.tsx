import Link from "next/link";
import { PageHeader } from "@/features/admin/components/ui";
import { AccountingAddonsCard } from "@/features/billing/components/accounting-addons-card";
import { CompanySettingsForm } from "@/features/company/components/company-settings-form";
import { CompanyBillingCard } from "@/features/subscription/components/company-billing-card";
import { getSubscriptionForCompany } from "@/features/subscription/queries";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { getStripeSecretKey } from "@/lib/stripe";

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

  const [{ data: company }, smsSettings, paymentSettings, subscription] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "name, timezone, route_cadence, default_hike_rate_cents, night_before_reminder_time, auto_send_gallery_on_closeout"
      )
      .eq("id", profile.company_id)
      .single(),
    supabase
      .from("companies")
      .select("sms_mode, sms_test_phone, sms_live_approved")
      .eq("id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select(
        "etransfer_email, etransfer_recipient_name, etransfer_instructions, show_card_payment"
      )
      .eq("id", profile.company_id)
      .maybeSingle(),
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
          autoSendGalleryOnCloseout={
            company?.auto_send_gallery_on_closeout !== false
          }
          smsSettingsAvailable={!smsSettings.error}
          smsMode={smsSettings.data?.sms_mode === "test" ? "test" : "live"}
          smsTestPhone={smsSettings.data?.sms_test_phone ?? ""}
          smsLiveApproved={smsSettings.data?.sms_live_approved !== false}
          paymentSettingsAvailable={!paymentSettings.error}
          etransferEmail={paymentSettings.data?.etransfer_email ?? ""}
          etransferRecipientName={paymentSettings.data?.etransfer_recipient_name ?? ""}
          etransferInstructions={paymentSettings.data?.etransfer_instructions ?? ""}
          showCardPayment={paymentSettings.data?.show_card_payment === true}
          stripeConfigured={Boolean(getStripeSecretKey())}
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
