import { EmptyState, PageHeader } from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notification_log")
    .select(
      `
      id,
      notification_type,
      body,
      status,
      created_at,
      customers ( owner_name ),
      dogs ( name )
    `
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Notification history"
        description="Automated reminders, ETAs, and status updates."
      />

      {!notifications?.length ? (
        <EmptyState message="No notifications sent yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-stone-700">
                  {n.notification_type.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(n.created_at).toLocaleString()} · {n.status}
                </span>
              </div>
              <p className="mt-1 text-stone-800">{n.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {one(
                  n.customers as
                    | { owner_name: string }
                    | { owner_name: string }[]
                )?.owner_name}
                {one(n.dogs as { name: string } | { name: string }[])?.name
                  ? ` · ${one(n.dogs as { name: string } | { name: string }[])?.name}`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
