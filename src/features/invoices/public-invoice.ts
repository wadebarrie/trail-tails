import { invoiceTaxCents, isInvoiceToken } from "@/features/invoices/etransfer";
import { createServiceClient } from "@/lib/supabase/service";
import type { InvoiceLine } from "@/types";

export type PublicInvoice = {
  companyName: string;
  customerName: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  taxCents: number | null;
  dueDate: string | null;
  lines: Pick<InvoiceLine, "id" | "hike_date" | "description" | "quantity" | "line_total_cents">[];
  etransferEmail: string | null;
  etransferRecipientName: string | null;
  etransferInstructions: string | null;
  showCardPayment: boolean;
  payUrl: string | null;
};

export async function getPublicInvoice(token: string): Promise<PublicInvoice | null> {
  if (!isInvoiceToken(token)) return null;
  try {
    const supabase = createServiceClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        "id, company_id, customer_id, status, invoice_number, currency, subtotal_cents, total_cents, due_date, stripe_pay_url"
      )
      .eq("public_token", token)
      .maybeSingle();
    if (error || !invoice) return null;

    const [companyResult, paymentResult, customerResult, linesResult] = await Promise.all([
      supabase
        .from("companies")
        .select("name")
        .eq("id", invoice.company_id)
        .maybeSingle(),
      supabase
        .from("companies")
        .select(
          "etransfer_email, etransfer_recipient_name, etransfer_instructions, show_card_payment"
        )
        .eq("id", invoice.company_id)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("owner_name")
        .eq("id", invoice.customer_id)
        .maybeSingle(),
      supabase
        .from("invoice_lines")
        .select("id, hike_date, description, quantity, line_total_cents")
        .eq("invoice_id", invoice.id)
        .order("hike_date", { ascending: true }),
    ]);
    if (companyResult.error || !companyResult.data) return null;

    const company = companyResult.data;
    const payment = paymentResult.error ? null : paymentResult.data;
    return {
      companyName: company.name as string,
      customerName: (customerResult.data?.owner_name as string) ?? "Customer",
      invoiceNumber: invoice.invoice_number as string,
      status: invoice.status as string,
      currency: (invoice.currency as string) ?? "CAD",
      subtotalCents: invoice.subtotal_cents as number,
      totalCents: invoice.total_cents as number,
      taxCents: invoiceTaxCents(
        invoice.subtotal_cents as number,
        invoice.total_cents as number
      ),
      dueDate: (invoice.due_date as string | null) ?? null,
      lines: (linesResult.data ?? []) as PublicInvoice["lines"],
      etransferEmail: (payment?.etransfer_email as string | null) ?? null,
      etransferRecipientName: (payment?.etransfer_recipient_name as string | null) ?? null,
      etransferInstructions: (payment?.etransfer_instructions as string | null) ?? null,
      showCardPayment: payment?.show_card_payment === true,
      payUrl: (invoice.stripe_pay_url as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
