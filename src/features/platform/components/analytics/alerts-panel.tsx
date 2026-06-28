import Link from "next/link";
import type { PlatformAlert } from "@/features/platform/analytics/types";

export function AlertsPanel({ alerts }: { alerts: PlatformAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        No companies flagged for attention right now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-900">
          Needs attention ({alerts.length})
        </h2>
      </div>
      <ul className="divide-y divide-stone-100">
        {alerts.slice(0, 12).map((alert, index) => (
          <li key={`${alert.companyId}-${index}`} className="px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/owner/companies/${alert.companyId}`}
                  className="font-medium text-[var(--color-trail-800)] hover:underline"
                >
                  {alert.companyName}
                </Link>
                <p className="mt-0.5 text-stone-600">{alert.message}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  alert.severity === "critical"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {alert.severity}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
