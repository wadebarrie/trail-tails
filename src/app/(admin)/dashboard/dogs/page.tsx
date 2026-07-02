import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
  Badge,
  TableShell,
  SearchBar,
  motionTableRowClassName,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { formatTime, WEEKDAYS } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";

export default async function DogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireRole("admin");
  const { q } = await searchParams;
  const supabase = await createClient();

  const base = supabase
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
      dog_schedule_days ( day_of_week )
    `
      )
    .eq("company_id", profile.company_id)
    .order("route_sort_order");

  const { data: dogs } = q ? await base.ilike("name", `%${q}%`) : await base;

  return (
    <div>
      <PageHeader
        title="Dogs"
        description="Manage dogs, schedules, and pickup windows"
        action={<PrimaryLink href="/dashboard/dogs/new">Add dog</PrimaryLink>}
      />

      <SearchBar defaultValue={q} placeholder="Search by dog name…" />

      {!dogs?.length ? (
        <EmptyState message="No dogs found." />
      ) : (
        <TableShell minWidth="42rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Dog</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {dogs.map((dog) => {
                const scheduleDays = (dog.dog_schedule_days ?? []) as {
                  day_of_week: number;
                }[];
                const customer = one(
                  dog.customers as
                    | { owner_name: string }
                    | { owner_name: string }[]
                );
                const days = scheduleDays
                  .map((d) => WEEKDAYS.find((w) => w.value === d.day_of_week)?.label)
                  .filter(Boolean)
                  .join(", ");
                const scheduleLabel =
                  dog.schedule_type === "as_needed" ? "As-needed" : days || "—";

                return (
                  <tr key={dog.id} className={motionTableRowClassName}>
                    <td className="px-4 py-3 text-stone-400">
                      {dog.route_sort_order + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/dogs/${dog.id}`}
                        className="font-medium text-[var(--color-trail-700)] hover:underline"
                      >
                        {dog.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {customer?.owner_name}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatTime(dog.pickup_window_start)}–
                      {formatTime(dog.pickup_window_end)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{scheduleLabel}</td>
                    <td className="px-4 py-3">
                      <Badge tone={dog.is_active ? "green" : "neutral"}>
                        {dog.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
