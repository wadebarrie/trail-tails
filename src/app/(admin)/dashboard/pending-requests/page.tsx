import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { ExceptionSyncFailureBanner } from "@/features/dogs/components/exception-sync-failure-banner";
import { PendingRequestActions } from "@/features/pending-requests/components/pending-request-actions";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

function statusLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "declined") return "Declined";
  return status.replace(/_/g, " ");
}

function commandLabel(commandType: string) {
  switch (commandType) {
    case "skip_tomorrow":
      return "Skip tomorrow";
    case "skip_weekday":
      return "Skip a weekday";
    case "skip_date":
      return "Skip a day";
    case "vacation":
      return "Vacation / time off";
    case "pause":
      return "Pause service";
    case "resume":
      return "Resume service";
    default:
      return commandType.replace(/_/g, " ");
  }
}

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
  const ownerName =
    one(
      req.customers as { owner_name: string } | { owner_name: string }[]
    )?.owner_name ?? "Unknown customer";

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-stone-900">{ownerName}</p>
          <p className="mt-1 text-sm font-medium text-stone-800">
            {commandLabel(req.command_type)}
          </p>
          <p className="mt-1 text-sm text-stone-600">“{req.raw_body}”</p>
          <p className="mt-1 text-xs text-stone-500">
            {new Date(req.created_at).toLocaleString()}
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
          {statusLabel(req.status)}
        </Badge>
      </div>
      {req.status === "pending" ? (
        <PendingRequestActions requestId={req.id} ownerName={ownerName} />
      ) : null}
    </Card>
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
        title="Customer texts"
        description="When a customer texts to change their schedule, approve or decline here before anything changes on the route."
      />

      <ExceptionSyncFailureBanner companyId={profile.company_id} />

      {!requests?.length ? (
        <EmptyState message="When customers text schedule changes, they’ll show up here for you to approve." />
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
              <EmptyState message="Nothing waiting right now." />
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
