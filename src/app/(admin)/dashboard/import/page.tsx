import Link from "next/link";
import {
  Card,
  PageHeader,
} from "@/features/admin/components/ui";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import {
  BulkImportForm,
  ImportColumnReference,
} from "@/features/import/components/bulk-import-form";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const [{ count: customerCount }, { count: dogCount }, { data: routes }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id),
      supabase
        .from("dogs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id),
      supabase
        .from("routes")
        .select("name")
        .eq("company_id", profile.company_id)
        .order("name"),
    ]);

  const routeNames = (routes ?? []).map((r) => r.name);

  return (
    <div>
      <PageHeader
        title="Bulk import"
        description="Download a CSV template, fill in your customers and dogs, then upload to import everything at once."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/import/template?examples=1"
              className={primaryButtonClassName}
            >
              Download template
            </a>
            {(customerCount ?? 0) > 0 || (dogCount ?? 0) > 0 ? (
              <a
                href="/api/import/export"
                className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Export current data
              </a>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-stone-900">How it works</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-stone-700">
            <li>
              Download the template — it includes example rows showing the expected
              format.
            </li>
            <li>
              Paste or type your customer list. Use one row per dog; repeat the
              customer phone on additional rows for multiple dogs.
            </li>
            <li>
              For a customer with no dogs yet, leave the dog columns blank on one
              row.
            </li>
            <li>
              Route names must match routes you have already created in{" "}
              <Link
                href="/dashboard/route"
                className="font-medium text-[var(--color-trail-700)] hover:underline"
              >
                Routes
              </Link>
              . Leave blank to assign later.
            </li>
            <li>Upload the completed CSV below. Existing records match by phone (customers) and name (dogs).</li>
          </ol>

          {routeNames.length > 0 ? (
            <div className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
              <span className="font-medium text-stone-700">Your routes: </span>
              {routeNames.join(", ")}
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800">
              No routes yet — you can still import customers and dogs, then assign
              routes afterward.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-stone-900">Upload CSV</h2>
          <p className="mt-1 text-sm text-stone-600">
            Maximum 500 rows per import. Addresses are geocoded when Google Maps is
            configured.
          </p>
          <div className="mt-4">
            <BulkImportForm />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-stone-900">Column reference</h2>
        <p className="mt-1 text-sm text-stone-600">
          Schedule days accept weekday names (Mon, Tue) or numbers (0=Sun through
          6=Sat).
        </p>
        <div className="mt-4">
          <ImportColumnReference />
        </div>
      </Card>
    </div>
  );
}
