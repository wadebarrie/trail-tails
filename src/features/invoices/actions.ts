"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/features/auth/queries";
import { getBillingLineItems } from "@/features/billing/queries";
import type { BillingLineItem } from "@/features/billing/queries";
import { nextInvoiceNumber } from "@/features/invoices/queries";
import { getDateInTimezone } from "@/lib/dates";
import type { PaymentMethod } from "@/types";

export type InvoiceActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_METHODS: PaymentMethod[] = ["e_transfer", "cash", "other"];
const DEFAULT_TERMS_DAYS = 14;

function revalidateInvoicePaths(invoiceId?: string) {
  revalidatePath("/dashboard/invoices");
  if (invoiceId) revalidatePath(`/dashboard/invoices/${invoiceId}`);
}

async function companyToday(companyId: string, offsetDays = 0) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .single();
  return getDateInTimezone(data?.timezone ?? "America/Los_Angeles", offsetDays);
}

/** Admin: create one draft invoice per customer from billable hikes in range. */
export async function createInvoiceDraftsForRangeAction(
  start: string,
  end: string
): Promise<InvoiceActionResult> {
  const profile = await requireRole("admin");

  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return { ok: false, error: "Choose a valid date range." };
  }
  if (end < start) {
    return { ok: false, error: "End date must be on or after the start date." };
  }

  const supabase = await createClient();

  let items: BillingLineItem[];
  try {
    items = await getBillingLineItems(profile.company_id, start, end);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not load hikes.",
    };
  }

  const billable = items.filter((i) => i.billable);
  const unpriced = billable.filter((i) => i.rateCents == null).length;
  const priced = billable.filter((i) => i.rateCents != null);

  if (!priced.length) {
    return {
      ok: false,
      error: unpriced
        ? "Billable hikes have no price. Set a default hike price in Settings first."
        : "No billable hikes in this date range.",
    };
  }

  // Skip hike-days that are already on an invoice so ranges can overlap safely.
  const { data: existing, error: existingError } = await supabase
    .from("invoice_lines")
    .select("hike_date, dog_id, invoices!inner ( customer_id, company_id )")
    .eq("invoices.company_id", profile.company_id)
    .gte("hike_date", start)
    .lte("hike_date", end);

  if (existingError) return { ok: false, error: existingError.message };

  const alreadyInvoiced = new Set<string>();
  for (const row of (existing ?? []) as unknown as {
    hike_date: string;
    dog_id: string | null;
    invoices: { customer_id: string } | { customer_id: string }[] | null;
  }[]) {
    const inv = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;
    if (inv && row.dog_id) {
      alreadyInvoiced.add(`${inv.customer_id}|${row.dog_id}|${row.hike_date}`);
    }
  }

  const byCustomer = new Map<string, BillingLineItem[]>();
  for (const item of priced) {
    if (alreadyInvoiced.has(`${item.customerId}|${item.dogId}|${item.date}`)) {
      continue;
    }
    const bucket = byCustomer.get(item.customerId) ?? [];
    bucket.push(item);
    byCustomer.set(item.customerId, bucket);
  }

  if (!byCustomer.size) {
    return {
      ok: false,
      error: "All billable hikes in this range are already on invoices.",
    };
  }

  const customerIds = [...byCustomer.keys()].sort((a, b) => {
    const nameA = byCustomer.get(a)![0].customerName;
    const nameB = byCustomer.get(b)![0].customerName;
    return nameA.localeCompare(nameB);
  });

  let created = 0;
  for (const customerId of customerIds) {
    const lines = byCustomer.get(customerId)!;
    const subtotal = lines.reduce((sum, l) => sum + (l.rateCents ?? 0), 0);

    // Re-read per invoice so numbers stay sequential and avoid collisions.
    const invoiceNumber = await nextInvoiceNumber(profile.company_id);

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        company_id: profile.company_id,
        customer_id: customerId,
        status: "draft",
        period_start: start,
        period_end: end,
        currency: "CAD",
        subtotal_cents: subtotal,
        total_cents: subtotal,
        invoice_number: invoiceNumber,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      return {
        ok: false,
        error: `${invoiceError?.message ?? "Could not create invoice."}${
          created ? ` (${created} draft${created === 1 ? "" : "s"} created before the error.)` : ""
        }`,
      };
    }

    const { error: linesError } = await supabase.from("invoice_lines").insert(
      lines.map((l) => ({
        invoice_id: invoice.id,
        hike_date: l.date,
        dog_id: l.dogId,
        description: `Dog hike — ${l.dogName}`,
        quantity: 1,
        unit_amount_cents: l.rateCents ?? 0,
        line_total_cents: l.rateCents ?? 0,
      }))
    );

    if (linesError) {
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return { ok: false, error: linesError.message };
    }

    created += 1;
  }

  revalidateInvoicePaths();
  const notes = [
    `Created ${created} draft invoice${created === 1 ? "" : "s"}.`,
    unpriced
      ? `${unpriced} billable hike${unpriced === 1 ? "" : "s"} skipped (no price set).`
      : null,
  ].filter(Boolean);
  return { ok: true, message: notes.join(" ") };
}

/** Form-friendly wrapper for useActionState. */
export async function createInvoiceDraftsFormAction(
  _prev: InvoiceActionResult | null,
  formData: FormData
): Promise<InvoiceActionResult> {
  return createInvoiceDraftsForRangeAction(
    String(formData.get("start") ?? ""),
    String(formData.get("end") ?? "")
  );
}

export async function markInvoiceSentAction(
  invoiceId: string
): Promise<InvoiceActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, due_date")
    .eq("id", invoiceId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!invoice) return { ok: false, error: "Invoice not found." };
  if (invoice.status !== "draft") {
    return { ok: false, error: "Only draft invoices can be marked as sent." };
  }

  const dueDate =
    invoice.due_date ??
    (await companyToday(profile.company_id, DEFAULT_TERMS_DAYS));

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      due_date: dueDate,
    })
    .eq("id", invoiceId)
    .eq("company_id", profile.company_id);

  if (error) return { ok: false, error: error.message };

  revalidateInvoicePaths(invoiceId);
  return { ok: true };
}

/** Form-friendly wrapper for useActionState (invoice id bound by caller). */
export async function markInvoiceSentFormAction(
  invoiceId: string,
  _prev: InvoiceActionResult | null
): Promise<InvoiceActionResult> {
  return markInvoiceSentAction(invoiceId);
}

export async function recordManualPaymentAction(
  invoiceId: string,
  input: {
    amountCents: number;
    method: PaymentMethod;
    paidAt?: string;
    reference?: string;
  }
): Promise<InvoiceActionResult> {
  const profile = await requireRole("admin");

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "Enter a payment amount greater than zero." };
  }
  if (!PAYMENT_METHODS.includes(input.method)) {
    return { ok: false, error: "Choose a payment method." };
  }

  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, total_cents, sent_at")
    .eq("id", invoiceId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!invoice) return { ok: false, error: "Invoice not found." };
  if (invoice.status === "paid") {
    return { ok: false, error: "This invoice is already paid." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("invoice_id", invoiceId);
  if (existingError) return { ok: false, error: existingError.message };

  const alreadyPaid = (existing ?? []).reduce(
    (sum, p) => sum + (p as { amount_cents: number }).amount_cents,
    0
  );
  const balance = invoice.total_cents - alreadyPaid;
  if (input.amountCents > balance) {
    return {
      ok: false,
      error: "Payment is more than the remaining balance.",
    };
  }

  let paidAtIso = new Date().toISOString();
  if (input.paidAt) {
    if (!DATE_RE.test(input.paidAt)) {
      return { ok: false, error: "Enter a valid payment date." };
    }
    paidAtIso = new Date(`${input.paidAt}T12:00:00Z`).toISOString();
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount_cents: input.amountCents,
    method: input.method,
    paid_at: paidAtIso,
    reference: input.reference?.trim() || null,
    recorded_by: profile.id,
  });
  if (paymentError) return { ok: false, error: paymentError.message };

  if (alreadyPaid + input.amountCents >= invoice.total_cents) {
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: paidAtIso,
        sent_at: invoice.sent_at ?? paidAtIso,
      })
      .eq("id", invoiceId)
      .eq("company_id", profile.company_id);
    if (error) return { ok: false, error: error.message };
  }

  revalidateInvoicePaths(invoiceId);
  return { ok: true };
}

/** Form-friendly wrapper: amount entered in dollars. */
export async function recordManualPaymentFormAction(
  invoiceId: string,
  _prev: InvoiceActionResult | null,
  formData: FormData
): Promise<InvoiceActionResult> {
  const raw = String(formData.get("amount") ?? "").replace(/[$,\s]/g, "");
  const amount = Number(raw);
  if (!raw || !Number.isFinite(amount)) {
    return { ok: false, error: "Enter a valid amount." };
  }

  return recordManualPaymentAction(invoiceId, {
    amountCents: Math.round(amount * 100),
    method: String(formData.get("method") ?? "") as PaymentMethod,
    paidAt: String(formData.get("paid_at") ?? "") || undefined,
    reference: String(formData.get("reference") ?? ""),
  });
}

/** Admin: flag sent invoices whose due date has passed as overdue. */
export async function markOverdueInvoicesAction(): Promise<InvoiceActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const today = await companyToday(profile.company_id);

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("company_id", profile.company_id)
    .eq("status", "sent")
    .lt("due_date", today)
    .select("id");

  if (error) return { ok: false, error: error.message };

  revalidateInvoicePaths();
  const count = data?.length ?? 0;
  return {
    ok: true,
    message: count
      ? `Marked ${count} invoice${count === 1 ? "" : "s"} overdue.`
      : "No sent invoices are past due.",
  };
}

export async function markOverdueFormAction(
  _prev: InvoiceActionResult | null
): Promise<InvoiceActionResult> {
  return markOverdueInvoicesAction();
}
