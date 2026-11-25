import { notFound } from "next/navigation";
import {
  Badge,
  BackLink,
  Card,
  PageHeader,
  TableShell,
} from "@/features/admin/components/ui";
import { requireRole } from "@/features/auth/queries";
import { formatCentsDisplay } from "@/features/billing/queries";
import { CreatePayLinkButton } from "@/features/invoices/components/create-pay-link-button";
import { CopyInvoiceLinkButton } from "@/features/invoices/components/copy-invoice-link-button";
import { SendInvoiceButton } from "@/features/invoices/components/send-invoice-button";
import { RecordPaymentForm } from "@/features/invoices/components/record-payment-form";
import { buildInvoicePublicUrl } from "@/features/invoices/etransfer";
import { getSiteUrl } from "@/lib/site-url";
import { getInvoiceWithLines } from "@/features/invoices/queries";
import {
  invoiceStatusLabel,
  invoiceStatusTone,
  paymentMethodLabel,
} from "@/features/invoices/status";
import { getDateInTimezoneAt } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;

  const detail = await getInvoiceWithLines(profile.company_id, id);
  if (!detail) notFound();

  const { invoice, customer, lines, payments, paidCents, balanceCents } = detail;

  const supabase = await createClient();
  const [{ data: company }, linkRow] = await Promise.all([
    supabase
      .from("companies")
      .select("timezone")
      .eq("id", profile.company_id)
      .single(),
    supabase
      .from("invoices")
      .select("public_token")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .maybeSingle(),
  ]);
  const timeZone = company?.timezone ?? "America/Los_Angeles";
  const today = getDateInTimezoneAt(timeZone, new Date());

  const canRecordPayment = invoice.status !== "paid" && balanceCents > 0;

  return (
    <div>
      <BackLink href="/dashboard/invoices">Back to invoices</BackLink>
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        description={`${customer?.owner_name ?? "Unknown customer"} · ${invoice.period_start} – ${invoice.period_end}`}
        action={
          invoice.status === "draft" ? (
            <SendInvoiceButton invoiceId={invoice.id} />
          ) : undefined
        }
      />

      {!linkRow.error && linkRow.data?.public_token ? (
        <div className="mb-4">
          <CopyInvoiceLinkButton
            url={buildInvoicePublicUrl(getSiteUrl(), linkRow.data.public_token as string)}
          />
        </div>
      ) : null}

      <p className="mb-6 text-sm text-stone-600">
        {customer?.email ? (
          <>
            Customer email:{" "}
            <a
              href={`mailto:${customer.email}`}
              className="font-medium text-[var(--color-trail-700)] hover:underline"
            >
              {customer.email}
            </a>
          </>
        ) : (
          <span className="text-amber-800">
            No email on file for this customer — add one before you send the
            invoice.
          </span>
        )}
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-stone-500">Status</p>
          <p className="mt-2">
            <Badge tone={invoiceStatusTone(invoice.status)}>
              {invoiceStatusLabel(invoice.status)}
            </Badge>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Total ({invoice.currency})</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {formatCentsDisplay(invoice.total_cents)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {formatCentsDisplay(paidCents)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-500">Balance</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">
            {formatCentsDisplay(balanceCents)}
          </p>
          {invoice.due_date ? (
            <p className="mt-1 text-xs text-stone-500">Due {invoice.due_date}</p>
          ) : null}
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-stone-900">Line items</h2>
      <TableShell minWidth="36rem">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Description</th>
              <th scope="col" className="px-4 py-3 font-medium">Qty</th>
              <th scope="col" className="px-4 py-3 font-medium">Unit</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3 text-stone-600">{line.hike_date}</td>
                <td className="px-4 py-3 text-stone-900">{line.description}</td>
                <td className="px-4 py-3 text-stone-600">{line.quantity}</td>
                <td className="px-4 py-3 text-stone-600">
                  {formatCentsDisplay(line.unit_amount_cents)}
                </td>
                <td className="px-4 py-3 text-right text-stone-900">
                  {formatCentsDisplay(line.line_total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200 bg-stone-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-medium text-stone-700">
                Total
              </td>
              <td className="px-4 py-3 text-right font-semibold text-stone-900">
                {formatCentsDisplay(invoice.total_cents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </TableShell>

      {payments.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">Payments</h2>
          <TableShell minWidth="32rem">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-left text-stone-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Method</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-stone-600">
                      {getDateInTimezoneAt(timeZone, new Date(payment.paid_at))}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {paymentMethodLabel(payment.method)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {payment.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-900">
                      {formatCentsDisplay(payment.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      ) : null}

      {canRecordPayment ? (
        <div className="mt-8 space-y-8">
          {(invoice.status === "sent" || invoice.status === "overdue") &&
          invoice.currency.toUpperCase() === "CAD" ? (
            <CreatePayLinkButton
              invoiceId={invoice.id}
              existingUrl={invoice.stripe_pay_url}
            />
          ) : null}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Record payment
            </h2>
            <RecordPaymentForm
              invoiceId={invoice.id}
              balanceCents={balanceCents}
              today={today}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
