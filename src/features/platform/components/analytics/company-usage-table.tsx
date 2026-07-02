import Link from "next/link";
import { TableShell } from "@/features/admin/components/ui";
import { formatUsd } from "@/features/platform/analytics/cost";
import {
  companyStatusLabel,
  healthStatusClass,
  healthStatusLabel,
  planTierLabel,
} from "@/features/platform/analytics/health";
import type { CompanyUsageRow } from "@/features/platform/analytics/types";

export function CompanyUsageTable({ companies }: { companies: CompanyUsageRow[] }) {
  return (
    <TableShell minWidth="72rem">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
          <tr>
            <th className="px-3 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Plan</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium text-right">Dogs</th>
            <th className="px-3 py-3 font-medium text-right">Drivers</th>
            <th className="px-3 py-3 font-medium text-right">Hikes</th>
            <th className="px-3 py-3 font-medium text-right">SMS</th>
            <th className="px-3 py-3 font-medium text-right">ETA</th>
            <th className="px-3 py-3 font-medium text-right">Failed</th>
            <th className="px-3 py-3 font-medium text-right">Cost</th>
            <th className="px-3 py-3 font-medium text-right">Revenue</th>
            <th className="px-3 py-3 font-medium text-right">Margin</th>
            <th className="px-3 py-3 font-medium">Last active</th>
            <th className="px-3 py-3 font-medium">Health</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {companies.length === 0 ? (
            <tr>
              <td colSpan={14} className="px-3 py-8 text-center text-stone-500">
                No companies yet.
              </td>
            </tr>
          ) : (
            companies.map((company) => (
              <tr key={company.id} className="hover:bg-stone-50/80">
                <td className="px-3 py-3">
                  <Link
                    href={`/owner/companies/${company.id}`}
                    className="font-medium text-[var(--color-trail-800)] hover:underline"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-stone-700">
                  {planTierLabel(company.plan)}
                </td>
                <td className="px-3 py-3 text-stone-700">
                  {companyStatusLabel(company.subscriptionStatus)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{company.activeDogs}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {company.activeDrivers}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {company.completedHikesThisMonth}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{company.smsSent}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {company.etaCalculations}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-red-700">
                  {company.smsFailed + company.failedNotifications}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatUsd(company.estimatedCostUsd)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatUsd(company.estimatedRevenueUsd)}
                </td>
                <td
                  className={`px-3 py-3 text-right tabular-nums ${
                    company.estimatedMarginUsd < 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {formatUsd(company.estimatedMarginUsd)}
                </td>
                <td className="px-3 py-3 text-stone-500">
                  {company.lastActiveAt
                    ? new Date(company.lastActiveAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${healthStatusClass(company.health)}`}
                  >
                    {healthStatusLabel(company.health)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableShell>
  );
}
