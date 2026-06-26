import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
  Badge,
  TableShell,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireRole("admin");
  const { q } = await searchParams;
  const supabase = await createClient();

  const base = supabase
    .from("customers")
    .select("id, owner_name, phone, secondary_owner_name, secondary_phone, email, address, is_active")
    .eq("company_id", profile.company_id)
    .order("owner_name");

  const { data } = q
    ? await base.or(
        `owner_name.ilike.%${q}%,phone.ilike.%${q}%,secondary_owner_name.ilike.%${q}%,secondary_phone.ilike.%${q}%,address.ilike.%${q}%`
      )
    : await base;

  const customers = data as Pick<
    Customer,
    "id" | "owner_name" | "phone" | "secondary_owner_name" | "secondary_phone" | "email" | "address" | "is_active"
  >[] | null;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer contact info and addresses"
        action={<PrimaryLink href="/dashboard/customers/new">Add customer</PrimaryLink>}
      />

      <form method="get" className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, or address…"
          className="w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </form>

      {!customers?.length ? (
        <EmptyState message="No customers found." />
      ) : (
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-medium text-[var(--color-trail-700)] hover:underline"
                    >
                      {c.owner_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    <div>{c.phone}</div>
                    {c.secondary_phone ? (
                      <div className="mt-0.5 text-xs text-stone-500">
                        {c.secondary_owner_name}: {c.secondary_phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{c.address}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.is_active ? "green" : "neutral"}>
                      {c.is_active ? "Active" : "Inactive"}
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
