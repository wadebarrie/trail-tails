import { PageHeader } from "@/features/admin/components/ui";
import { RouteDogsList } from "@/features/routes/components/route-dogs-list";
import { RouteDriverSelect } from "@/features/routes/components/route-driver-select";
import { listRoutes } from "@/features/routes/queries";
import { requireRole } from "@/features/auth/queries";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function RouteOrderPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const routes = await listRoutes(profile.company_id);

  const [{ data: dogs }, { data: drivers }] = await Promise.all([
    supabase
      .from("dogs")
      .select("id, name, route_id, customers(owner_name)")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("route_sort_order"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", profile.company_id)
      .eq("role", "driver")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Routes"
        description="Assign a default driver and set pickup order for each route. Applies to Today and Tomorrow hikes."
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
              <section
                key={route.id}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      {route.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {routeDogs.length} dog{routeDogs.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <RouteDriverSelect
                    routeId={route.id}
                    currentDriverId={route.default_driver_id}
                    drivers={drivers ?? []}
                  />
                </div>
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
