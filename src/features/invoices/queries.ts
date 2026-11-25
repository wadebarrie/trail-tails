import { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/supabase/relations";
import type { Invoice, InvoiceLine, InvoiceStatus, Payment } from "@/types";

export type InvoiceListRow = Invoice & { customer_name: string };

export type InvoiceWithLines = {
  invoice: Invoice;
  customer: { id: string; owner_name: string; email: string | null } | null;
  lines: InvoiceLine[];
  payments: Payment[];
  paidCents: number;
  balanceCents: number;
};

const INVOICE_COLUMNS =
  "id, company_id, customer_id, status, period_start, period_end, currency, subtotal_cents, total_cents, due_date, sent_at, paid_at, invoice_number, notes, created_by, created_at, updated_at";

export async function listInvoices(
  companyId: string,
  status?: InvoiceStatus
): Promise<InvoiceListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(`${INVOICE_COLUMNS}, customers ( owner_name )`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as (Invoice & { customers: unknown })[]).map(
    ({ customers, ...invoice }) => ({
      ...invoice,
      customer_name:
        one(customers as { owner_name: string } | { owner_name: string }[] | null)
          ?.owner_name ?? "Unknown customer",
    })
  );
}

export async function getInvoiceWithLines(
  companyId: string,
  invoiceId: string
): Promise<InvoiceWithLines | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(`${INVOICE_COLUMNS}, customers ( id, owner_name, email )`)
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { customers, ...invoice } = data as unknown as Invoice & {
    customers: unknown;
  };

  const [linesRes, paymentsRes] = await Promise.all([
    supabase
      .from("invoice_lines")
      .select(
        "id, invoice_id, hike_date, dog_id, description, quantity, unit_amount_cents, line_total_cents, created_at"
      )
      .eq("invoice_id", invoiceId)
      .order("hike_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select(
        "id, invoice_id, amount_cents, method, paid_at, reference, recorded_by, created_at"
      )
      .eq("invoice_id", invoiceId)
      .order("paid_at", { ascending: true }),
  ]);

  if (linesRes.error) throw new Error(linesRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  const payments = (paymentsRes.data ?? []) as Payment[];
  const paidCents = payments.reduce((sum, p) => sum + p.amount_cents, 0);

  return {
    invoice,
    customer: one(
      customers as
        | { id: string; owner_name: string; email: string | null }
        | { id: string; owner_name: string; email: string | null }[]
        | null
    ),
    lines: (linesRes.data ?? []) as InvoiceLine[],
    payments,
    paidCents,
    balanceCents: Math.max(0, invoice.total_cents - paidCents),
  };
}

/**
 * Next invoice number for the company, e.g. INV-2026-0007.
 * `offset` lets callers reserve several numbers in one batch (0 = next).
 */
export async function nextInvoiceNumber(
  companyId: string,
  offset = 0,
  year = new Date().getUTCFullYear()
): Promise<string> {
  const supabase = await createClient();
  const prefix = `INV-${year}-`;

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("company_id", companyId)
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  const last = (data as { invoice_number: string }[] | null)?.[0]
    ?.invoice_number;
  const lastSeq = last ? Number.parseInt(last.slice(prefix.length), 10) : 0;
  const seq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1 + offset;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
