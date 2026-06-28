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
        title="Superadmin dashboard"
        description="Platform usage, customer health, and estimated economics across all tenants."
        action={
          <div className="flex gap-2 text-sm">
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
        <MetricCard label="Trial companies" value={metrics.trialCompanies} />
        <MetricCard label="Paying companies" value={metrics.payingCompanies} />
        <MetricCard label="Active dogs" value={metrics.activeDogs} />
        <MetricCard label="Active drivers" value={metrics.activeDrivers} />
        <MetricCard label="Routes this month" value={metrics.routesThisMonth} />
        <MetricCard label="Completed hikes" value={metrics.completedHikesThisMonth} subtext="This month" />
        <MetricCard label="SMS sent" value={metrics.smsSentThisMonth} subtext="This month" />
        <MetricCard label="ETA calculations" value={metrics.etaCalculationsThisMonth} subtext="en_route proxy" />
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
        <TrendChart title="Active companies" points={trends.activeCompanies} />
        <TrendChart title="Active dogs" points={trends.activeDogs} />
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
