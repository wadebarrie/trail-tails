import { PageHeader } from "@/features/admin/components/ui";
import { UsageEventsTable } from "@/features/platform/components/analytics/usage-events-table";
import { listUsageEvents } from "@/features/platform/analytics/queries";

export const dynamic = "force-dynamic";

export default async function OwnerEventsPage() {
  const events = await listUsageEvents({ limit: 150 });

  return (
    <div>
      <PageHeader
        title="Usage events"
        description="Cross-tenant feed of SMS, notifications, system logs, and webhook issues."
      />
      <UsageEventsTable events={events} />
    </div>
  );
}
