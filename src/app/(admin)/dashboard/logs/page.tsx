import {
  Badge,
  EmptyState,
  PageHeader,
  TableShell,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { LogCategory, LogLevel } from "@/lib/logger";

type SystemLogRow = {
  id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context: Record<string, unknown> | null;
  created_at: string;
};

function toneForLevel(level: LogLevel): "green" | "amber" | "red" | "neutral" {
  switch (level) {
    case "error":
      return "red";
    case "warn":
      return "amber";
    case "info":
      return "neutral";
    default:
      return "neutral";
  }
}

function formatContext(context: Record<string, unknown> | null) {
  if (!context || Object.keys(context).length === 0) return null;
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
}

export default async function SystemLogsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("system_logs")
    .select("id, level, category, message, context, created_at")
    .or(`company_id.eq.${profile.company_id},company_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (logs ?? []) as SystemLogRow[];

  return (
    <div>
      <PageHeader
        title="System logs"
        description="SMS failures, API errors, and other operational issues. Also visible in Netlify function logs as JSON."
      />

      {rows.length === 0 ? (
        <EmptyState message="No warnings or errors logged yet." />
      ) : (
        <TableShell minWidth="48rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => {
                const contextText = formatContext(row.context);
                return (
                  <tr key={row.id} className="align-top hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={toneForLevel(row.level)}>{row.level}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">
                      {row.category}
                    </td>
                    <td className="px-4 py-3 text-stone-800">
                      <p>{row.message}</p>
                      {contextText ? (
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-stone-100 p-2 text-xs text-stone-600">
                          {contextText}
                        </pre>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
