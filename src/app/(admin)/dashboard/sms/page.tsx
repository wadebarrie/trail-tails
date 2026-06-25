import { EmptyState, PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function SmsHistoryPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

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

  return (
    <div>
      <PageHeader
        title="SMS history"
        description="Inbound and outbound text messages."
      />

      {!messages?.length ? (
        <EmptyState message="No SMS messages yet. Messages appear here when drivers send updates or customers reply." />
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium capitalize text-stone-700">
                  {msg.direction}
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-stone-800">{msg.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {one(
                  msg.customers as
                    | { owner_name: string }
                    | { owner_name: string }[]
                )?.owner_name ?? "Unknown"}{" "}
                · {msg.from_number} → {msg.to_number} · {msg.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
