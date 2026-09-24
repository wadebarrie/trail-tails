import { PageHeader, Card, EmptyState } from "@/features/admin/components/ui";
import { RouteAddDogSelect } from "@/features/routes/components/route-add-dog-select";
import { RouteDogsList } from "@/features/routes/components/route-dogs-list";
import { RouteDriverSelect } from "@/features/routes/components/route-driver-select";
import { RouteVehicleSelect } from "@/features/routes/components/route-vehicle-select";
import { CreateRouteForm } from "@/features/routes/components/route-form";
import { RouteEditPanel } from "@/features/routes/components/route-edit-panel";
import { hikePeriodLabel } from "@/features/hikes/hike-period";
import { getRouteScheduleDays, listRoutes } from "@/features/routes/queries";
import { requireRole } from "@/features/auth/queries";
import { listAssignableDrivers } from "@/features/drivers/queries";
import { formatScheduleDayLabels } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { safeAppReturnPath } from "@/lib/safe-return-path";

export default async function RouteOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { returnTo: rawReturn } = await searchParams;
  const returnTo = rawReturn
    ? safeAppReturnPath(rawReturn, ONBOARDING_PATH)
    : undefined;
  const routes = await listRoutes(profile.company_id);

  const [{ data: dogs }, drivers, { data: vehicles }] = await Promise.all([
    supabase
      .from("dogs")
      .select(
        "id, name, route_id, route_sort_order, schedule_type, customers(owner_name), routes(name)"
      )
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
    listAssignableDrivers(profile.company_id, { activeOnly: true }),
    supabase
      .from("vehicles")
      .select("id, name, plate")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const allDogs = dogs ?? [];

  return (
    <div>
      <PageHeader
        title="Routes"
        description="Each route is a morning or afternoon walk with its own dogs, driver, vehicle, and schedule. Create separate routes when you run twice daily."
      />

      <Card className="mb-10">
        <h2 className="text-lg font-semibold text-stone-900">Add route</h2>
        <p className="mt-1 text-sm text-stone-500">
          New routes need at least one scheduled day before they show on hike
          pages.
        </p>
        <div className="mt-4">
          <CreateRouteForm returnTo={returnTo} />
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
              .filter(
                (d) => d.route_id !== route.id && d.schedule_type !== "as_needed"
              )
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
              <Card
                key={route.id}
                className="motion-interactive hover:shadow-[var(--elevation-3)]"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <p className="text-base font-semibold text-stone-900">
                      {route.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      {hikePeriodLabel(route.period)} ·{" "}
                      {formatScheduleDayLabels(scheduleDays)}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {routeDogs.length} dog{routeDogs.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <RouteDriverSelect
                      routeId={route.id}
                      currentDriverId={route.default_driver_id}
                      drivers={drivers}
                    />
                    <RouteVehicleSelect
                      routeId={route.id}
                      currentVehicleId={route.default_vehicle_id}
                      vehicles={vehicles ?? []}
                    />
                  </div>
                </div>

                <div className="mb-6 border-b border-stone-100 pb-4">
                  <RouteEditPanel
                    routeId={route.id}
                    routeName={route.name}
                    defaultDays={scheduleDays}
                    defaultPeriod={route.period}
                    dogCount={routeDogs.length}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-stone-700">Dogs</h3>

                  <RouteAddDogSelect routeId={route.id} dogs={addableDogs} />

                  <div>
                    <h4 className="mb-1 text-sm font-medium text-stone-600">
                      Pickup order
                    </h4>
                    <p className="mb-3 text-xs text-stone-500">
                      Drop-offs run in reverse order automatically.
                    </p>
                    {items.length > 0 ? (
                      <>
                        <RouteDogsList routeId={route.id} items={items} />
                        <div className="mt-6">
                          <h4 className="mb-1 text-sm font-medium text-stone-600">
                            Drop-off order
                          </h4>
                          <p className="mb-3 text-xs text-stone-500">
                            Automatically the reverse of pickup order.
                          </p>
                          <ol className="space-y-2">
                            {[...items].reverse().map((item, index) => (
                              <li
                                key={item.id}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3"
                              >
                                <p className="font-medium text-stone-900">
                                  {index + 1}. {item.label}
                                </p>
                                {item.sublabel ? (
                                  <p className="mt-0.5 text-sm text-stone-500">
                                    {item.sublabel}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-stone-500">
                        No dogs on this route yet.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
