import { PageHeader } from "@/features/admin/components/ui";
import { SortableList } from "@/features/admin/components/sortable-list";
import { requireRole } from "@/features/auth/queries";
import { reorderDefaultRouteAction } from "@/features/hikes/actions";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function RouteOrderPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, customers(owner_name)")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("route_sort_order");

  const items = (dogs ?? []).map((dog) => ({
    id: dog.id,
    label: dog.name,
    sublabel: one(
      dog.customers as { owner_name: string } | { owner_name: string }[]
    )?.owner_name,
  }));

  return (
    <div>
      <PageHeader
        title="Default route order"
        description="Drag to set the preferred pickup sequence. New hikes copy this order; you can override per day on Today/Tomorrow."
      />

      {items.length > 0 ? (
        <SortableList items={items} onReorder={reorderDefaultRouteAction} />
      ) : (
        <p className="text-stone-500">No active dogs yet.</p>
      )}
    </div>
  );
}
