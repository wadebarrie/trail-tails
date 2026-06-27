import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  TableShell,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DriversPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: drivers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, is_active")
    .eq("company_id", profile.company_id)
    .eq("role", "driver")
    .order("full_name");

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Dog walkers who use the driver mobile app. Assign default drivers on the Routes page."
        action={<PrimaryLink href="/dashboard/drivers/new">Add driver</PrimaryLink>}
      />

      {!drivers?.length ? (
        <EmptyState message="No drivers yet. Add a driver to create their login." />
      ) : (
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/drivers/${d.id}`}
                      className="font-medium text-[var(--color-trail-700)] hover:underline"
                    >
                      {d.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{d.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.is_active ? "green" : "neutral"}>
                      {d.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
