import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/features/admin/components/ui";
import { RouteAddDogSelect } from "@/features/routes/components/route-add-dog-select";
import { RouteDogsList } from "@/features/routes/components/route-dogs-list";
import { RouteDriverSelect } from "@/features/routes/components/route-driver-select";
import { RouteVehicleSelect } from "@/features/routes/components/route-vehicle-select";
import { CreateRouteForm } from "@/features/routes/components/route-form";
import { RouteEditPanel } from "@/features/routes/components/route-edit-panel";
import { cadencePeriodLabel } from "@/features/company/route-cadence";
import { getCompanyRouteCadence } from "@/features/company/queries";
import { getRouteScheduleDays, listRoutes } from "@/features/routes/queries";
import { requireRole } from "@/features/auth/queries";
import { listAssignableDrivers } from "@/features/drivers/queries";
import { formatScheduleDayLabels } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { landingPrimaryButtonClassName } from "@/features/admin/components/button-styles";
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
  const [routes, routeCadence] = await Promise.all([
    listRoutes(profile.company_id),
    getCompanyRouteCadence(profile.company_id),
  ]);
  const onceDaily = routeCadence === "once";

  const [{ data: dogs }, drivers, { data: vehicles }] = await Promise.all([
    supabase
      .from("dogs")
      .select(
        "id, name, route_id, route_sort_order, schedule_type, pickup_window_start, pickup_window_end, customers(owner_name, address, address_line1, city), routes(name)"
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
  const recurringDogs = allDogs.filter((d) => d.schedule_type !== "as_needed");

  return (
    <div>
      <PageHeader
        title="PackRoutes"
        description={
          onceDaily
            ? "A PackRoute is a service zone you cover — usually a neighbourhood or area. Each one has its own dogs, driver, van, and weekdays."
            : "A PackRoute is a service zone you cover — usually a neighbourhood or area — for morning or afternoon. Each one has its own dogs, driver, van, and weekdays."
        }
      />

      {returnTo ? (
        <div className="mb-6 rounded-xl border border-[var(--color-trail-600)] bg-[var(--color-trail-50)] px-4 py-3">
          <p className="text-sm font-medium text-stone-900">
            Onboarding: set your PackRoute
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {onceDaily
              ? "Name the zone, set weekdays, and check the dogs that ride this run — all in the form below."
              : "Name the zone, pick morning or afternoon, set weekdays, and check the dogs that ride this run — all in the form below."}
          </p>
          <Link
            href={returnTo}
            className={`${landingPrimaryButtonClassName} mt-3 inline-flex`}
          >
            Back to onboarding
          </Link>
        </div>
      ) : null}

      <Card className="mb-10">
        <h2 className="text-lg font-semibold text-stone-900">Add PackRoute</h2>
        <p className="mt-1 text-sm text-stone-500">
          {onceDaily
            ? "A PackRoute is a service zone (neighbourhood or area). Add dogs while you create it."
            : "A PackRoute is a service zone (neighbourhood or area) for morning or afternoon. Add dogs while you create it."}
        </p>
        <div className="mt-4">
          <CreateRouteForm
            routeCadence={routeCadence}
            dogs={recurringDogs
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
              .sort((a, b) => {
                const aAssigned = a.currentRouteName ? 1 : 0;
                const bAssigned = b.currentRouteName ? 1 : 0;
                if (aAssigned !== bAssigned) return aAssigned - bAssigned;
                return a.name.localeCompare(b.name);
              })}
          />
        </div>
      </Card>

      {!routes.length ? (
        <EmptyState message="No PackRoutes yet. Add a service zone above to get started." />
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

            const items = routeDogs.map((dog) => {
              const customer = one(
                dog.customers as
                  | {
                      owner_name: string;
                      address: string | null;
                      address_line1: string | null;
                      city: string | null;
                    }
                  | {
                      owner_name: string;
                      address: string | null;
                      address_line1: string | null;
                      city: string | null;
                    }[]
              );
              const address =
                customer?.address_line1?.trim() ||
                customer?.address?.trim() ||
                null;
              const addressWithCity = [address, customer?.city?.trim()]
                .filter(Boolean)
                .join(", ");

              return {
                id: dog.id,
                label: dog.name,
                sublabel: customer?.owner_name,
                address: addressWithCity || null,
              };
            });

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
                      {[
                        cadencePeriodLabel(route.period, routeCadence),
                        formatScheduleDayLabels(scheduleDays),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
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
                    routeCadence={routeCadence}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-stone-700">Dogs</h3>

                  <RouteAddDogSelect
                    routeId={route.id}
                    dogs={addableDogs}
                    emphasize={routeDogs.length === 0}
                    emptyHint={
                      recurringDogs.length === 0
                        ? "No recurring dogs yet — add a dog first, then assign them here."
                        : routeDogs.length === recurringDogs.length
                          ? "Every recurring dog is already on this PackRoute."
                          : undefined
                    }
                  />

                  <div>
                    <h4 className="mb-1 text-sm font-medium text-stone-600">
                      Pickup order
                    </h4>
                    <p className="mb-3 text-xs text-stone-500">
                      Drop-offs run in reverse order automatically. Use Sort by
                      address for a street-order starting point, then drag to
                      fine-tune.
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
                                    {[item.sublabel, item.address]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                ) : item.address ? (
                                  <p className="mt-0.5 text-sm text-stone-500">
                                    {item.address}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-stone-500">
                        No dogs on this PackRoute yet — check dogs in the form
                        above when creating, or use Add dog here.
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
