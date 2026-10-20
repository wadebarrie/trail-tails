import Link from "next/link";
import { RosterTable } from "@/features/admin/components/roster-table";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
} from "@/features/admin/components/ui";
import { QueryErrorBanner } from "@/features/admin/components/query-error-banner";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Customer } from "@/types";

export default async function CustomersPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, owner_name, phone, secondary_owner_name, secondary_phone, email, address, is_active")
    .eq("company_id", profile.company_id)
    .order("owner_name");

  const customers = data as Pick<
    Customer,
    "id" | "owner_name" | "phone" | "secondary_owner_name" | "secondary_phone" | "email" | "address" | "is_active"
  >[] | null;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Households you serve — contact info and addresses"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/import"
              className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Import spreadsheet
            </Link>
            <PrimaryLink href="/dashboard/customers/new">Add customer</PrimaryLink>
          </div>
        }
      />

      {error ? <QueryErrorBanner /> : null}

      {!error && !customers?.length ? (
        <EmptyState
          message="No customers yet. Add your first household to get started."
          action={
            <PrimaryLink href="/dashboard/customers/new">
              Add customer
            </PrimaryLink>
          }
        />
      ) : !error && customers?.length ? (
        <RosterTable
          noun="customer"
          searchPlaceholder="Search by name, phone, or address…"
          columns={[
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "second", label: "Second contact" },
            { key: "address", label: "Address" },
            { key: "status", label: "Status" },
          ]}
          rows={customers.map((c) => ({
            id: c.id,
            href: `/dashboard/customers/${c.id}`,
            cells: {
              name: c.owner_name,
              phone: formatPhoneDisplay(c.phone),
              second: c.secondary_phone
                ? `${c.secondary_owner_name || "Second contact"} · ${formatPhoneDisplay(c.secondary_phone)}`
                : "",
              address: c.address ?? "",
              status: c.is_active ? "Active" : "Inactive",
            },
          }))}
        />
      ) : null}
    </div>
  );
}
