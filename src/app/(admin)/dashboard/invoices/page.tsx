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
import { formatCentsDisplay } from "@/features/billing/queries";
import { MarkOverdueButton } from "@/features/invoices/components/mark-overdue-button";
import { listInvoices } from "@/features/invoices/queries";
import type { InvoiceListRow } from "@/features/invoices/queries";
import {
  invoiceStatusLabel,
  invoiceStatusTone,
} from "@/features/invoices/status";

export default async function InvoicesPage() {
  const profile = await requireRole("admin");

  let invoices: InvoiceListRow[] = [];
  let failed = false;
  try {
    invoices = await listInvoices(profile.company_id);
  } catch {
    failed = true;
  }

  const hasSent = invoices.some((i) => i.status === "sent");

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Draft invoices from your closed-out hikes, mark them sent, send a card pay link, or record e-Transfer / cash. Amounts show as CA$."
        action={
          <PrimaryLink href="/dashboard/hike-report">
            Create from hike report
          </PrimaryLink>
        }
      />

      {failed ? <QueryErrorBanner /> : null}

      {hasSent ? (
        <div className="mb-6">
          <MarkOverdueButton />
        </div>
      ) : null}

      {!failed && !invoices.length ? (
        <EmptyState
          message="No invoices yet. Pick a date range on the hike report and create drafts."
          action={
            <PrimaryLink href="/dashboard/hike-report">Open hike report</PrimaryLink>
          }
        />
      ) : null}

      {!failed && invoices.length ? (
        <TableShell minWidth="44rem">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Period</th>
                <th scope="col" className="px-4 py-3 font-medium">Total</th>
                <th scope="col" className="px-4 py-3 font-medium">Due</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className={motionTableRowClassName}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="font-medium text-[var(--color-trail-700)] hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-900">
                    {invoice.customer_name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {invoice.period_start} – {invoice.period_end}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatCentsDisplay(invoice.total_cents)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {invoice.due_date ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={invoiceStatusTone(invoice.status)}>
                      {invoiceStatusLabel(invoice.status)}
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
