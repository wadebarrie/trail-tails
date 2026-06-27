import {
  Badge,
  EmptyState,
  PageHeader,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { PendingRequestActions } from "@/features/pending-requests/components/pending-request-actions";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

function RequestCard({
  req,
}: {
  req: {
    id: string;
    raw_body: string;
    command_type: string;
    status: string;
    created_at: string;
    customers: unknown;
  };
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-stone-900">
            {one(
              req.customers as
                | { owner_name: string }
                | { owner_name: string }[]
            )?.owner_name ?? "Unknown customer"}
          </p>
          <p className="mt-1 font-mono text-sm text-stone-700">{req.raw_body}</p>
          <p className="mt-1 text-xs text-stone-500">
            {new Date(req.created_at).toLocaleString()} ·{" "}
            {req.command_type.replace("_", " ")}
          </p>
        </div>
        <Badge
          tone={
            req.status === "pending"
              ? "amber"
              : req.status === "approved"
                ? "green"
                : "red"
          }
        >
          {req.status}
        </Badge>
      </div>
      {req.status === "pending" ? (
        <PendingRequestActions requestId={req.id} />
      ) : null}
    </div>
  );
}

export default async function PendingRequestsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("pending_requests")
    .select(
      `
      id,
      raw_body,
      command_type,
      status,
      created_at,
      customers ( owner_name, phone )
    `
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100);

  const pending = (requests ?? []).filter((req) => req.status === "pending");
  const recent = (requests ?? []).filter((req) => req.status !== "pending");

  return (
    <div>
      <PageHeader
        title="Pending requests"
        description="Customer SMS schedule-change requests. Review and approve or decline."
      />

      {!requests?.length ? (
        <EmptyState message="No requests yet." />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              Needs review ({pending.length})
            </h2>
            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map((req) => (
                  <RequestCard key={req.id} req={req} />
                ))}
              </div>
            ) : (
              <EmptyState message="No requests waiting for review." />
            )}
          </section>

          {recent.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
                Recent ({recent.length})
              </h2>
              <div className="space-y-3">
                {recent.map((req) => (
                  <RequestCard key={req.id} req={req} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
