import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  TableShell,
  motionTableRowClassName,
} from "@/features/admin/components/ui";
import { QueryErrorBanner } from "@/features/admin/components/query-error-banner";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { vehicleDisplayLabel } from "@/features/vehicles/schema";
import type { Vehicle } from "@/types";

export default async function VehiclesPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, plate, capacity, is_active")
    .eq("company_id", profile.company_id)
    .order("name");

  const vehicles = data as Pick<
    Vehicle,
    "id" | "name" | "plate" | "capacity" | "is_active"
  >[] | null;

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Vans and trucks for your routes. Set a default on Routes, and override per day on Today / Tomorrow."
        action={
          <PrimaryLink href="/dashboard/vehicles/new">Add vehicle</PrimaryLink>
        }
      />

      {error ? <QueryErrorBanner /> : null}

      {!error && !vehicles?.length ? (
        <EmptyState message="No vehicles yet. Add one so drivers know which van to take." />
      ) : !error && vehicles?.length ? (
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Vehicle
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Capacity
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {vehicles.map((v) => (
                <tr key={v.id} className={motionTableRowClassName}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/vehicles/${v.id}`}
                      className="font-medium text-[var(--color-trail-700)] hover:underline"
                    >
                      {vehicleDisplayLabel(v)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {v.capacity != null ? `${v.capacity} dogs` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={v.is_active ? "green" : "neutral"}>
                      {v.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}
    </div>
  );
}
