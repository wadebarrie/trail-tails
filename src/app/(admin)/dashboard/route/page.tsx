import { PageHeader } from "@/features/admin/components/ui";
import { RouteDogsList } from "@/features/routes/components/route-dogs-list";
import { listRoutes } from "@/features/routes/queries";
import { requireRole } from "@/features/auth/queries";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function RouteOrderPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const routes = await listRoutes(profile.company_id);

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, route_id, customers(owner_name)")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("route_sort_order");

  return (
    <div>
      <PageHeader
        title="Routes"
        description="Default pickup order per route. New hikes copy this order; override per day on Today/Tomorrow."
      />

      {!routes.length ? (
        <p className="text-stone-500">No routes configured.</p>
      ) : (
        <div className="space-y-10">
          {routes.map((route) => {
            const routeDogs = (dogs ?? []).filter((d) => d.route_id === route.id);
            const items = routeDogs.map((dog) => ({
              id: dog.id,
              label: dog.name,
              sublabel: one(
                dog.customers as
                  | { owner_name: string }
                  | { owner_name: string }[]
              )?.owner_name,
            }));

            return (
              <section key={route.id}>
                <h2 className="mb-3 text-lg font-semibold text-stone-900">
                  {route.name}
                </h2>
                {items.length > 0 ? (
                  <RouteDogsList routeId={route.id} items={items} />
                ) : (
                  <p className="text-sm text-stone-500">
                    No dogs assigned to this route yet.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
