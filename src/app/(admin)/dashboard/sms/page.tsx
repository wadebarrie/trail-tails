import { Badge, EmptyState, PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { formatDateTimeInTimezone } from "@/lib/dates";
import { getCompanyTimezone } from "@/features/company/queries";
import { smsStatusTone, smsTypeLabel, unsentNotificationLabel } from "@/features/sms/labels";
import { splitRecentUnsent } from "@/features/sms/unsent-window";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

type UnsentNote = {
  id: string;
  notification_type: string;
  body: string;
  error_message: string | null;
  created_at: string;
  customers: { owner_name: string } | { owner_name: string }[] | null;
};

function UnsentNoteCard({
  note,
  timeZone,
}: {
  note: UnsentNote;
  timeZone: string;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>
          {smsTypeLabel({
            direction: "outbound",
            notificationType: note.notification_type,
            body: note.body,
          })}
        </Badge>
        <Badge tone="amber">{unsentNotificationLabel(note.error_message)}</Badge>
        <span className="ml-auto text-xs text-stone-500">
          {formatDateTimeInTimezone(note.created_at, timeZone)}
        </span>
      </div>
      <p className="mt-2 text-stone-800">{note.body}</p>
      {note.error_message ? (
        <p className="mt-1 text-xs text-amber-900">{note.error_message}</p>
      ) : null}
      <p className="mt-1 text-xs text-stone-500">
        {one(note.customers)?.owner_name ?? "Unknown"}
      </p>
    </div>
  );
}

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

  const { data: unsentRows } = await supabase
    .from("notification_log")
    .select("id, notification_type, body, status, error_message, created_at, customers ( owner_name )")
    .eq("company_id", profile.company_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(30);
  const unsent = (unsentRows ?? []) as UnsentNote[];
  const { recent: recentUnsent, older: olderUnsent } = splitRecentUnsent(unsent);

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

      {!messages?.length && !unsent.length ? (
        <EmptyState message="No SMS messages yet. Messages appear here when drivers send updates or customers reply." />
      ) : null}

      {messages?.length ? (
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
      ) : null}

      {recentUnsent.length ? (
        <div className="mt-8 space-y-2">
          <h2 className="text-sm font-semibold text-stone-800">
            Not sent yet
          </h2>
          <p className="text-sm text-stone-600">
            These from the last 48 hours didn&apos;t finish. On-the-way and
            drop-off texts are not sent again later — a late text would be
            wrong. Night-before reminders are retried on the next run when
            Twilio did not accept them.
          </p>
          {recentUnsent.map((note) => (
            <UnsentNoteCard key={note.id} note={note} timeZone={timeZone} />
          ))}
        </div>
      ) : null}

      {olderUnsent.length ? (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-stone-600">
            Show older unsent texts ({olderUnsent.length})
          </summary>
          <div className="mt-3 space-y-2">
            {olderUnsent.map((note) => (
              <UnsentNoteCard key={note.id} note={note} timeZone={timeZone} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
