import { createClient } from "@/lib/supabase/server";

export const EXCEPTION_SYNC_FAILURE_MESSAGE =
  "Failed to update hike stops after a schedule exception.";

const RECENT_MS = 24 * 60 * 60 * 1000;

/** Most recent exception→stop sync failure for this company (last 24h), if any. */
export async function getRecentExceptionSyncFailure(
  companyId: string
): Promise<{ message: string; createdAt: string } | null> {
  const supabase = await createClient();
  const since = new Date(Date.now() - RECENT_MS).toISOString();

  const { data } = await supabase
    .from("system_logs")
    .select("message, created_at, context")
    .eq("company_id", companyId)
    .eq("level", "error")
    .eq("category", "hike")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  const match = (data ?? []).find(
    (row) =>
      row.message === EXCEPTION_SYNC_FAILURE_MESSAGE ||
      (typeof row.context === "object" &&
        row.context !== null &&
        (row.context as { kind?: string }).kind === "exception_stop_sync")
  );

  if (!match) return null;
  return { message: match.message, createdAt: match.created_at };
}
