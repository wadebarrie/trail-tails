import { Badge, EmptyState, PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { formatDateTimeInTimezone } from "@/lib/dates";
import { getCompanyTimezone } from "@/features/company/queries";
import { smsStatusTone, smsTypeLabel } from "@/features/sms/labels";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function SmsHistoryPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const timeZone = await getCompanyTimezone(profile.company_id);

  const { data: messages } = await supabase
    .from("sms_messages")
    .select(
      `
      id,
      direction,
      body,
      status,
      from_number,
      to_number,
      created_at,
      customers ( owner_name )
    `
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100);

  const messageIds = (messages ?? []).map((message) => message.id as string);
  const typeByMessage = new Map<string, string>();
  if (messageIds.length) {
    const { data: logs } = await supabase
      .from("notification_log")
      .select("sms_message_id, notification_type")
      .in("sms_message_id", messageIds);
    for (const log of logs ?? []) {
      const smsId = log.sms_message_id as string | null;
      if (smsId) typeByMessage.set(smsId, log.notification_type as string);
    }
  }

  return (
    <div>
      <PageHeader
        title="Texts sent"
        description="Inbound and outbound text messages."
      />

      {!messages?.length ? (
        <EmptyState message="No SMS messages yet. Messages appear here when drivers send updates or customers reply." />
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const typeLabel = smsTypeLabel({
              direction: msg.direction,
              notificationType: typeByMessage.get(msg.id) ?? null,
              body: msg.body,
            });
            return (
              <div
                key={msg.id}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{typeLabel}</Badge>
                  <Badge tone={smsStatusTone(msg.status)}>{msg.status}</Badge>
                  <span className="ml-auto text-xs text-stone-500">
                    {formatDateTimeInTimezone(msg.created_at, timeZone)}
                  </span>
                </div>
                <p className="mt-2 text-stone-800">{msg.body}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {one(
                    msg.customers as
                      | { owner_name: string }
                      | { owner_name: string }[]
                  )?.owner_name ?? "Unknown"}{" "}
                  · {msg.from_number} → {msg.to_number}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
