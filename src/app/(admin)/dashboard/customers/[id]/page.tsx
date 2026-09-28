import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, BackLink, Card } from "@/features/admin/components/ui";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { requireRole } from "@/features/auth/queries";
import { formatWindowRange } from "@/lib/dates";
import { one } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: dogs }] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .maybeSingle(),
    supabase
      .from("dogs")
      .select(
        "id, name, is_active, pickup_window_start, pickup_window_end, route_id, routes(name)"
      )
      .eq("customer_id", id)
      .eq("company_id", profile.company_id)
      .order("name"),
  ]);

  if (!data) notFound();

  const customer = data as Customer;
  const dogRows = dogs ?? [];

  return (
    <div>
      <BackLink href="/dashboard/customers">Back to customers</BackLink>
      <PageHeader title="Edit customer" description={customer.owner_name} />

      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Dogs</h2>
            <p className="mt-1 text-sm text-stone-500">
              Pickup windows live on each dog — not the household. Edit a dog to
              change the default window used on new day plans.
            </p>
          </div>
          <Link
            href={`/dashboard/dogs/new?customer_id=${customer.id}`}
            className={primaryButtonClassName}
          >
            Add dog
          </Link>
        </div>

        {dogRows.length === 0 ? (
          <p className="text-sm text-stone-500">
            No dogs yet for this customer.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {dogRows.map((dog) => {
              const routeName = one(
                dog.routes as { name: string } | { name: string }[] | null
              )?.name;
              const window = formatWindowRange(
                dog.pickup_window_start,
                dog.pickup_window_end
              );

              return (
                <li
                  key={dog.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {dog.name}
                      {!dog.is_active ? (
                        <span className="ml-2 text-xs font-normal text-stone-400">
                          Inactive
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      Default pickup: {window ?? "Not set"}
                      {routeName ? ` · ${routeName}` : " · No route"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/dogs/${dog.id}`}
                    className="text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
                  >
                    Edit dog →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <CustomerForm customer={customer} />
    </div>
  );
}
