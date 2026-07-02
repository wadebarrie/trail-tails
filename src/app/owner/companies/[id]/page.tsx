import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/features/admin/components/ui";
import { CompanyPlanForm } from "@/features/platform/components/analytics/company-plan-form";
import { FounderProfileForm } from "@/features/platform/components/analytics/founder-profile-form";
import { UsageEventsTable } from "@/features/platform/components/analytics/usage-events-table";
import { formatUsd } from "@/features/platform/analytics/cost";
import {
  healthStatusClass,
  healthStatusLabel,
  planTierLabel,
  companyStatusLabel,
} from "@/features/platform/analytics/health";
import { getCompanyDetail } from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

function currentMonthParam(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function OwnerCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyDetail(id);
  if (!company) notFound();

  const allEvents = [...company.recentEvents, ...company.recentErrors]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 25);

  const reviewMonth = currentMonthParam();

  return (
    <div>
      <PageHeader
        title={company.name}
        description={`Company detail · ${company.timezone}`}
        action={
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`/owner/reviews/${company.id}/${reviewMonth}`}
              className="font-medium text-[var(--color-trail-700)] hover:underline"
            >
              Monthly review →
            </Link>
            <Link
              href="/owner"
              className="text-stone-600 hover:text-[var(--color-trail-700)] hover:underline"
            >
              ← Overview
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${healthStatusClass(company.health)}`}
        >
          {healthStatusLabel(company.health)}
        </span>
        <span className="text-sm text-stone-600">
          {planTierLabel(company.plan)} ·{" "}
          {companyStatusLabel(company.subscriptionStatus)} · {company.billingCurrency}{" "}
          {company.monthlyPrice}/mo
          {company.grandfathered ? " · Grandfathered" : ""}
        </span>
        {company.followUpDate ? (
          <span className="text-sm text-stone-500">
            Follow-up {new Date(company.followUpDate).toLocaleDateString()}
          </span>
        ) : null}
        {company.alerts.length > 0 ? (
          <span className="text-sm text-amber-700">{company.alerts.join(" · ")}</span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StatsGrid company={company} />

          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">
              Recent activity
            </h2>
            <UsageEventsTable events={allEvents} />
          </section>
        </div>

        <div className="space-y-6">
          <CompanyPlanForm company={company} />
          <FounderProfileForm company={company} />

          <section className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900">Last active users</h2>
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {company.lastActiveUsers.length === 0 ? (
                <li className="py-2 text-stone-500">No active users.</li>
              ) : (
                company.lastActiveUsers.map((user) => (
                  <li key={user.name} className="flex justify-between py-2">
                    <span>
                      {user.name}{" "}
                      <span className="text-stone-500">({user.role})</span>
                    </span>
                    <span className="text-stone-500">
                      {user.lastSeen
                        ? new Date(user.lastSeen).toLocaleDateString()
                        : "—"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({
  company,
}: {
  company: Awaited<ReturnType<typeof getCompanyDetail>> & object;
}) {
  const stats = [
    ["Active dogs", company.activeDogs],
    ["Active drivers", company.activeDrivers],
    ["Office admins", company.activeAdmins],
    ["Total routes", company.totalRoutes],
    ["Customers", company.totalCustomers],
    ["Routes this month", company.routesThisMonth],
    ["Completed hikes", company.completedHikesThisMonth],
    ["Driver actions", company.driverActionsThisMonth],
    ["Pending requests", company.pendingRequestsThisMonth],
    ["Notifications sent", company.notificationsSent],
    ["SMS sent", company.smsSent],
    ["SMS inbound", company.smsInbound],
    ["ETA notifications", company.etaCalculations],
    ["Failed SMS", company.smsFailed],
    ["Failed notifications", company.failedNotifications],
    ["Webhook errors", company.webhookErrors],
    ["Est. cost", formatUsd(company.estimatedCostUsd)],
    ["Est. revenue", formatUsd(company.estimatedRevenueUsd)],
    ["Est. margin", formatUsd(company.estimatedMarginUsd)],
    [
      "Trial ends",
      company.trialEndsAt
        ? new Date(company.trialEndsAt).toLocaleDateString()
        : "—",
    ],
    [
      "Last active",
      company.lastActiveAt
        ? new Date(company.lastActiveAt).toLocaleString()
        : "—",
    ],
    ["Created", new Date(company.createdAt).toLocaleDateString()],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-stone-200 bg-white p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-stone-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
