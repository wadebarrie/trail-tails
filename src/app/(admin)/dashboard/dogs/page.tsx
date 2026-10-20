import { RosterTable } from "@/features/admin/components/roster-table";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
} from "@/features/admin/components/ui";
import { QueryErrorBanner } from "@/features/admin/components/query-error-banner";
import { requireRole } from "@/features/auth/queries";
import { listAssignableDrivers } from "@/features/drivers/queries";
import { createClient } from "@/lib/supabase/server";
import { formatTime, WEEKDAYS } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";

function weekdayLabels(days: number[]) {
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => WEEKDAYS.find((weekday) => weekday.value === day)?.label)
    .filter(Boolean)
    .join(", ");
}

export default async function DogsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const [{ data: dogs, error }, drivers, { data: vehicles }] = await Promise.all([
    supabase
      .from("dogs")
      .select(
        `
      id,
      name,
      breed,
      is_active,
      schedule_type,
      pickup_window_start,
      pickup_window_end,
      route_sort_order,
      customers ( owner_name ),
      routes ( name, default_vehicle_id, default_driver_id ),
      dog_schedule_days ( day_of_week )
    `
      )
      .eq("company_id", profile.company_id)
      .order("route_sort_order"),
    listAssignableDrivers(profile.company_id, { activeOnly: false }),
    supabase
      .from("vehicles")
      .select("id, name")
      .eq("company_id", profile.company_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Dogs"
        description="Dogs on your roster — usual pickup times and which days they hike"
        action={<PrimaryLink href="/dashboard/dogs/new">Add dog</PrimaryLink>}
      />

      {error ? <QueryErrorBanner /> : null}

      {!error && !dogs?.length ? (
        <EmptyState
          message="No dogs yet. Add your first dog to start building routes."
          action={<PrimaryLink href="/dashboard/dogs/new">Add dog</PrimaryLink>}
        />
      ) : !error && dogs?.length ? (
        <RosterTable
          noun="dog"
          searchPlaceholder="Search by dog, owner, route, or van…"
          columns={[
            { key: "name", label: "Dog" },
            { key: "owner", label: "Owner" },
            { key: "route", label: "Route" },
            { key: "van", label: "Van / driver" },
            { key: "pickup", label: "Pickup" },
            { key: "days", label: "Days" },
            { key: "status", label: "Status" },
          ]}
          rows={dogs.map((dog) => {
            const scheduleDays = (dog.dog_schedule_days ?? []) as {
              day_of_week: number;
            }[];
            const customer = one(
              dog.customers as
                | { owner_name: string }
                | { owner_name: string }[]
            );
            const route = one(
              dog.routes as
                | {
                    name: string;
                    default_vehicle_id: string | null;
                    default_driver_id: string | null;
                  }
                | {
                    name: string;
                    default_vehicle_id: string | null;
                    default_driver_id: string | null;
                  }[]
                | null
            );
            const van = vehicles?.find((v) => v.id === route?.default_vehicle_id);
            const driver = drivers.find((d) => d.id === route?.default_driver_id);
            const days = weekdayLabels(scheduleDays.map((d) => d.day_of_week));
            const scheduleLabel =
              dog.schedule_type === "as_needed" ? "Only when booked" : days;
            return {
              id: dog.id,
              href: `/dashboard/dogs/${dog.id}`,
              cells: {
                name: dog.name,
                owner: customer?.owner_name ?? "",
                route: route?.name ?? "Unassigned",
                van: [van?.name, driver?.full_name].filter(Boolean).join(" · "),
                pickup: `${formatTime(dog.pickup_window_start)}–${formatTime(dog.pickup_window_end)}`,
                days: scheduleLabel,
                status: dog.is_active ? "Active" : "Inactive",
              },
            };
          })}
        />
      ) : null}
    </div>
  );
}
