import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  TableShell,
  motionTableRowClassName,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { EnableSelfAsDriverButton } from "@/features/drivers/components/enable-self-as-driver-button";
import { listAssignableDrivers } from "@/features/drivers/queries";

export default async function DriversPage() {
  const profile = await requireRole("admin");
  const drivers = await listAssignableDrivers(profile.company_id, {
    activeOnly: false,
  });
  const selfCanDrive =
    profile.role === "admin" && (profile.can_drive ?? false);

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="People who use the driver mobile app — including company admins who also drive (same login)."
        action={<PrimaryLink href="/dashboard/drivers/new">Add driver</PrimaryLink>}
      />

      {!selfCanDrive ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">You can drive with your admin login</p>
          <p className="mt-1 text-amber-900/90">
            No second email needed. Enable driver access for yourself, then use{" "}
            <strong>Driver view</strong> in the header or sign in and open{" "}
            <code className="rounded bg-amber-100/80 px-1">/today</code>.
          </p>
          <div className="mt-3">
            <EnableSelfAsDriverButton />
          </div>
        </div>
      ) : null}

      {!drivers.length ? (
        <EmptyState message="No drivers yet. Add a driver, or enable yourself as a driver above." />
      ) : (
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {drivers.map((d) => (
                <tr key={d.id} className={motionTableRowClassName}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/drivers/${d.id}`}
                      className="font-medium text-[var(--color-trail-700)] hover:underline"
                    >
                      {d.full_name}
                      {d.id === profile.id ? " (you)" : ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{d.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.role === "admin" ? "amber" : "neutral"}>
                      {d.role === "admin" ? "Admin + driver" : "Driver"}
                    </Badge>
                  </td>
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
