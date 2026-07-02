import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  TableShell,
  motionTableRowClassName,
} from "@/features/admin/components/ui";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import { requireRole } from "@/features/auth/queries";
import { BillingDateRangeFilter } from "@/features/billing/components/billing-date-range-filter";
import { billingStatusLabel } from "@/features/billing/status";
import {
  defaultBillingDateRange,
  formatCentsDisplay,
  getBillingLineItems,
  summarizeBilling,
} from "@/features/billing/queries";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/features/billing/status";

function statusTone(
  status: BillingStatus
): "green" | "amber" | "red" | "neutral" {
  switch (status) {
    case "completed":
      return "green";
    case "pending":
      return "amber";
    case "cancelled":
    case "skipped":
    case "no_show":
      return "red";
    default:
      return "neutral";
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const profile = await requireRole("admin");
  const { start: startParam, end: endParam } = await searchParams;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone, default_hike_rate_cents")
    .eq("id", profile.company_id)
    .single();

  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const defaults = defaultBillingDateRange(timeZone);
  const start = startParam ?? defaults.start;
  const end = endParam ?? defaults.end;

  const items = await getBillingLineItems(profile.company_id, start, end);
  const summary = summarizeBilling(items);

  const exportUrl = `/api/billing/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Hike-day report for invoicing. One row per dog per day (pickup stop)."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Hike price
            </Link>
            <a
              href={exportUrl}
              className={primaryButtonClassName}
            >
              Export CSV
            </a>
          </div>
        }
      />

      <BillingDateRangeFilter start={start} end={end} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-stone-500">Billable hikes</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {summary.billableDays}
          </p>
          {summary.billableCents > 0 ? (
            <p className="mt-1 text-sm text-stone-600">
              {formatCentsDisplay(summary.billableCents)} estimated
            </p>
          ) : company?.default_hike_rate_cents == null ? (
            <p className="mt-1 text-xs text-stone-500">
              <Link href="/dashboard/settings" className="text-[var(--color-trail-700)] hover:underline">
                Set default hike price
              </Link>
            </p>
          ) : null}
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Skipped / cancelled</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {summary.skippedDays + summary.cancelledDays}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">No show</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {summary.noShowDays}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {summary.pendingDays}
          </p>
        </Card>
      </div>

      {summary.byCustomer.length > 0 ? (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">
            By customer
          </h2>
          <TableShell minWidth="28rem">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-left text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Billable hikes</th>
                  <th className="px-4 py-3 font-medium">Est. total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {summary.byCustomer.map((row) => (
                  <tr key={row.customerId}>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {row.customerName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {row.billableDays}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {row.billableCents > 0
                        ? formatCentsDisplay(row.billableCents)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {!items.length ? (
        <EmptyState message="No hike days in this date range." />
      ) : (
        <TableShell minWidth="48rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Dog</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Billable</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr key={`${item.date}-${item.dogId}`} className={motionTableRowClassName}>
                  <td className="px-4 py-3 text-stone-600">{item.date}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {item.customerName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.dogName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(item.billingStatus)}>
                      {billingStatusLabel(item.billingStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={item.billable ? "green" : "neutral"}>
                      {item.billable ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.rateCents != null
                      ? formatCentsDisplay(item.rateCents)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
