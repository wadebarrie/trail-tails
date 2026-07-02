import Link from "next/link";
import { PageHeader } from "@/features/admin/components/ui";
import { AlertsPanel } from "@/features/platform/components/analytics/alerts-panel";
import { CompanyUsageTable } from "@/features/platform/components/analytics/company-usage-table";
import {
  MetricCard,
  MetricCardUsd,
} from "@/features/platform/components/analytics/metric-card";
import { TrendChart } from "@/features/platform/components/analytics/trend-chart";
import {
  getPlatformOverview,
  getPlatformTrends,
} from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

export default async function OwnerOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const trendPeriod = period === "monthly" ? "monthly" : "daily";

  const [{ metrics, companies, alerts }, trends] = await Promise.all([
    getPlatformOverview(),
    getPlatformTrends(trendPeriod),
  ]);

  return (
    <div>
      <PageHeader
        title="Founder dashboard"
        description="Customer health, usage, value delivered, and estimated economics across all tenants."
        action={
          <div className="flex gap-2 text-sm">
            <Link
              href="/owner/reviews"
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
            >
              Monthly reviews
            </Link>
            <Link
              href="/owner"
              className={`rounded-lg px-3 py-1.5 ${
                trendPeriod === "daily"
                  ? "bg-[var(--color-trail-800)] text-white"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              Daily trends
            </Link>
            <Link
              href="/owner?period=monthly"
              className={`rounded-lg px-3 py-1.5 ${
                trendPeriod === "monthly"
                  ? "bg-[var(--color-trail-800)] text-white"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              Monthly trends
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Total companies" value={metrics.totalCompanies} />
        <MetricCard label="Active companies" value={metrics.activeCompanies} subtext="Active in 30d" />
        <MetricCard label="At risk" value={metrics.atRiskCompanies} tone="warning" />
        <MetricCard label="Trial companies" value={metrics.trialCompanies} />
        <MetricCard label="Paying companies" value={metrics.payingCompanies} />
        <MetricCard label="Beta partners" value={metrics.betaPartners} />
        <MetricCard
          label="Case study candidates"
          value={metrics.caseStudyCandidates}
          subtext="Health + flagged"
        />
        <MetricCard
          label="Grandfathered"
          value={metrics.grandfatheredCompanies}
          subtext="Custom pricing"
        />
        <MetricCardUsd label="Paying MRR" amount={metrics.payingMrrUsd} />
        <MetricCardUsd label="Trial MRR potential" amount={metrics.trialMrrPotentialUsd} />
        <MetricCardUsd label="Est. total MRR" amount={metrics.estimatedMrrUsd} subtext="Incl. trials" />
        <MetricCard label="Past due" value={metrics.pastDueSubscriptions} tone="warning" />
        <MetricCard label="Active dogs" value={metrics.activeDogs} />
        <MetricCard label="Active drivers" value={metrics.activeDrivers} />
        <MetricCard label="Office admins" value={metrics.activeAdmins} />
        <MetricCard label="Routes this month" value={metrics.routesThisMonth} />
        <MetricCard label="Completed hikes" value={metrics.completedHikesThisMonth} subtext="This month" />
        <MetricCard label="Driver actions" value={metrics.driverActionsThisMonth} subtext="This month" />
        <MetricCard label="Pending requests" value={metrics.pendingRequestsThisMonth} subtext="This month" />
        <MetricCard label="Notifications sent" value={metrics.notificationsSentThisMonth} subtext="This month" />
        <MetricCard label="SMS sent" value={metrics.smsSentThisMonth} subtext="This month" />
        <MetricCard label="ETA notifications" value={metrics.etaCalculationsThisMonth} />
        <MetricCard
          label="Failed notifications"
          value={metrics.failedNotificationsThisMonth}
          tone="warning"
        />
        <MetricCard label="Failed SMS" value={metrics.failedSmsThisMonth} tone="warning" />
        <MetricCardUsd label="Est. infra cost" amount={metrics.estimatedInfraCostUsd} subtext="This month" />
        <MetricCardUsd
          label="Est. gross margin"
          amount={metrics.estimatedGrossMarginUsd}
          tone={metrics.estimatedGrossMarginUsd >= 0 ? "positive" : "negative"}
          subtext={`Revenue ${metrics.estimatedRevenueUsd.toFixed(0)} USD`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AlertsPanel alerts={alerts} />
        <TrendChart title="SMS sent" points={trends.smsSent} />
        <TrendChart title="ETA calculations" points={trends.etaCalculations} />
        <TrendChart title="Completed hikes" points={trends.completedHikes} />
        <TrendChart title="New companies (signups)" points={trends.activeCompanies} />
        <TrendChart title="New active dogs (records)" points={trends.activeDogs} />
        <TrendChart
          title="Failure rate"
          points={trends.failureRate}
          valueFormat="percent"
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Company usage</h2>
        <CompanyUsageTable companies={companies} />
      </section>
    </div>
  );
}
