import type { Metadata } from "next";
import { formatCentsDisplay } from "@/features/billing/queries";
import { publicInvoicePaymentState } from "@/features/invoices/etransfer";
import { getPublicInvoice } from "@/features/invoices/public-invoice";
import { invoiceStatusLabel } from "@/features/invoices/status";
import type { InvoiceStatus } from "@/types";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: NOINDEX_ROBOTS,
  referrer: "no-referrer",
};

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);

  if (!invoice) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Invoice not found</h1>
        <p className="mt-2 text-stone-600">
          Check the link in your text, or ask the company to send it again.
        </p>
      </main>
    );
  }

  const payment = publicInvoicePaymentState({
    status: invoice.status,
    etransferEmail: invoice.etransferEmail,
    showCardPayment: invoice.showCardPayment,
    payUrl: invoice.payUrl,
  });
  const status = invoiceStatusLabel(
    (["draft", "sent", "paid", "overdue"].includes(invoice.status)
      ? invoice.status
      : "sent") as InvoiceStatus
  );

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
          {invoice.companyName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">
          Invoice {invoice.invoiceNumber}
        </h1>
        <p className="mt-1 text-stone-600">{invoice.customerName}</p>
        <p className="mt-2 text-sm text-stone-500">
          {status}
          {invoice.dueDate ? ` · Due ${invoice.dueDate}` : ""}
        </p>
      </header>

      <ul className="mt-6 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {invoice.lines.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="text-stone-900">{line.description}</p>
              <p className="text-xs text-stone-500">
                {line.hike_date}
                {line.quantity > 1 ? ` · ${line.quantity}` : ""}
              </p>
            </div>
            <p className="shrink-0 font-medium text-stone-900">
              {formatCentsDisplay(line.line_total_cents)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between text-stone-600">
          <dt>Subtotal</dt>
          <dd>{formatCentsDisplay(invoice.subtotalCents)}</dd>
        </div>
        {invoice.taxCents != null ? (
          <div className="flex justify-between text-stone-600">
            <dt>Tax</dt>
            <dd>{formatCentsDisplay(invoice.taxCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-semibold text-stone-900">
          <dt>Total</dt>
          <dd>{formatCentsDisplay(invoice.totalCents)}</dd>
        </div>
      </dl>

      {payment.paid ? (
        <p className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-lg font-semibold text-emerald-900">
          Paid
        </p>
      ) : null}

      {payment.showEtransfer && invoice.etransferEmail ? (
        <section className="mt-8 rounded-xl border border-[var(--color-trail-200)] bg-[var(--color-trail-50)] px-4 py-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Pay by Interac e-Transfer
          </h2>
          <p className="mt-2 text-sm text-stone-700">
            Send {formatCentsDisplay(invoice.totalCents)} to{" "}
            <span className="font-medium">{invoice.etransferEmail}</span>
            {invoice.etransferRecipientName
              ? ` (${invoice.etransferRecipientName})`
              : ""}
            .
          </p>
          <p className="mt-2 text-sm text-stone-700">
            Use invoice {invoice.invoiceNumber} as the message or reference.
          </p>
          {invoice.etransferInstructions ? (
            <p className="mt-2 text-sm text-stone-600">{invoice.etransferInstructions}</p>
          ) : null}
        </section>
      ) : null}

      {payment.showCard && invoice.payUrl ? (
        <a
          href={invoice.payUrl}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800"
        >
          Pay by card
        </a>
      ) : null}
    </main>
  );
}
