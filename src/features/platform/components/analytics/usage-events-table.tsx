import Link from "next/link";
import { TableShell } from "@/features/admin/components/ui";
import type { UsageEvent } from "@/features/platform/analytics/types";

export function UsageEventsTable({ events }: { events: UsageEvent[] }) {
  return (
    <TableShell minWidth="56rem">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
          <tr>
            <th className="px-3 py-3 font-medium">Time</th>
            <th className="px-3 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Type</th>
            <th className="px-3 py-3 font-medium">Level</th>
            <th className="px-3 py-3 font-medium">Summary</th>
            <th className="px-3 py-3 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                No events recorded yet.
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} className="align-top">
                <td className="px-3 py-3 whitespace-nowrap text-stone-500">
                  {new Date(event.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  {event.companyId ? (
                    <Link
                      href={`/owner/companies/${event.companyId}`}
                      className="text-[var(--color-trail-800)] hover:underline"
                    >
                      {event.companyName ?? "—"}
                    </Link>
                  ) : (
                    "Platform"
                  )}
                </td>
                <td className="px-3 py-3 capitalize text-stone-700">{event.eventType}</td>
                <td className="px-3 py-3">
                  <LevelBadge level={event.level} />
                </td>
                <td className="px-3 py-3 text-stone-900">{event.summary}</td>
                <td className="max-w-xs px-3 py-3 text-stone-600">
                  {event.detail ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableShell>
  );
}

function LevelBadge({ level }: { level: UsageEvent["level"] }) {
  const className =
    level === "error"
      ? "bg-red-100 text-red-800"
      : level === "warn"
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-700";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {level}
    </span>
  );
}
