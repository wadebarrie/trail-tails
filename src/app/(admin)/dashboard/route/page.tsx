import { PageHeader, Card, EmptyState } from "@/features/admin/components/ui";
import { RouteAddDogSelect } from "@/features/routes/components/route-add-dog-select";
import { RouteDogsList } from "@/features/routes/components/route-dogs-list";
import { RouteDriverSelect } from "@/features/routes/components/route-driver-select";
import {
  CreateRouteForm,
  EditRouteForm,
} from "@/features/routes/components/route-form";
import { getRouteScheduleDays, listRoutes } from "@/features/routes/queries";
import { requireRole } from "@/features/auth/queries";
import { formatScheduleDayLabels } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

export default async function RouteOrderPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const routes = await listRoutes(profile.company_id);

  const [{ data: dogs }, { data: drivers }] = await Promise.all([
    supabase
      .from("dogs")
      .select(
        "id, name, route_id, route_sort_order, customers(owner_name), routes(name)"
      )
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", profile.company_id)
      .eq("role", "driver")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const allDogs = dogs ?? [];

  return (
    <div>
      <PageHeader
        title="Routes"
        description="Set which days each route runs, assign dogs and a default driver, and order pickups. Each dog belongs to one route at a time."
      />

      <Card className="mb-10">
        <h2 className="text-lg font-semibold text-stone-900">Add route</h2>
        <p className="mt-1 text-sm text-stone-500">
          New routes need at least one scheduled day before they show on hike
          pages.
        </p>
        <div className="mt-4">
          <CreateRouteForm />
        </div>
      </Card>

      {!routes.length ? (
        <EmptyState message="No routes configured yet. Add one above to get started." />
      ) : (
        <div className="space-y-10">
          {routes.map((route) => {
            const routeDogs = allDogs
              .filter((d) => d.route_id === route.id)
              .sort((a, b) => a.route_sort_order - b.route_sort_order);

            const addableDogs = allDogs
              .filter((d) => d.route_id !== route.id)
              .map((dog) => ({
                id: dog.id,
                name: dog.name,
                ownerName:
                  one(
                    dog.customers as
                      | { owner_name: string }
                      | { owner_name: string }[]
                  )?.owner_name ?? "",
                currentRouteName: one(
                  dog.routes as { name: string } | { name: string }[] | null
                )?.name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name));

            const items = routeDogs.map((dog) => ({
              id: dog.id,
              label: dog.name,
              sublabel: one(
                dog.customers as
                  | { owner_name: string }
                  | { owner_name: string }[]
              )?.owner_name,
            }));

            const scheduleDays = getRouteScheduleDays(route);

            return (
              <section
                key={route.id}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <p className="text-sm text-stone-500">
                      {formatScheduleDayLabels(scheduleDays)}
                    </p>
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

                <EditRouteForm
                  routeId={route.id}
                  defaultName={route.name}
                  defaultDays={scheduleDays}
                />

                <div className="mt-6 space-y-4 border-t border-stone-100 pt-4">
                  <h3 className="text-sm font-medium text-stone-700">Dogs</h3>

                  <RouteAddDogSelect routeId={route.id} dogs={addableDogs} />

                  <div>
                    <h4 className="mb-3 text-sm font-medium text-stone-600">
                      Pickup order
                    </h4>
                    {items.length > 0 ? (
                      <RouteDogsList routeId={route.id} items={items} />
                    ) : (
                      <p className="text-sm text-stone-500">
                        No dogs on this route yet.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
