import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import type { StripeWebhookResult } from "@/features/subscription/process-stripe-webhook";

const PURPOSE = "customer_invoice";

/** Apply a completed payment Checkout session to a customer invoice. */
export async function applyCustomerInvoiceCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<StripeWebhookResult> {
  if (session.mode !== "payment") {
    return { ok: true, action: "ignored" };
  }
  if (session.metadata?.purpose !== PURPOSE) {
    return { ok: true, action: "ignored" };
  }
  if (session.payment_status !== "paid") {
    return { ok: true, action: "ignored" };
  }

  const invoiceId = session.metadata.invoice_id?.trim();
  const companyId = session.metadata.company_id?.trim();
  if (!invoiceId || !companyId) {
    return {
      ok: false,
      error: "invoice_checkout_missing_metadata",
      permanent: true,
    };
  }

  const amountCents =
    typeof session.amount_total === "number" ? session.amount_total : null;
  if (!amountCents || amountCents <= 0) {
    return {
      ok: false,
      error: "invoice_checkout_missing_amount",
      permanent: true,
    };
  }

  const supabase = createServiceClient();

  // Idempotent: same Checkout session must not double-post.
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("reference", session.id)
    .maybeSingle();
  if (existingPayment) {
    return { ok: true, action: "duplicate" };
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, company_id, status, total_cents, sent_at, paid_at")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (invoiceError) return { ok: false, error: invoiceError.message };
  if (!invoice) {
    return { ok: false, error: "invoice_not_found", permanent: true };
  }
  if (invoice.status === "paid") {
    return { ok: true, action: "ignored" };
  }

  const { data: priorPayments, error: priorError } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("invoice_id", invoiceId);
  if (priorError) return { ok: false, error: priorError.message };

  const alreadyPaid = (priorPayments ?? []).reduce(
    (sum, row) => sum + (row as { amount_cents: number }).amount_cents,
    0
  );
  const balance = invoice.total_cents - alreadyPaid;
  if (balance <= 0) {
    return { ok: true, action: "ignored" };
  }

  const creditCents = Math.min(amountCents, balance);
  const paidAt = new Date().toISOString();

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount_cents: creditCents,
    method: "card",
    paid_at: paidAt,
    reference: session.id,
    recorded_by: null,
  });
  if (paymentError) {
    // Unique race on reference is fine — treat as duplicate.
    if (paymentError.code === "23505") {
      return { ok: true, action: "duplicate" };
    }
    return { ok: false, error: paymentError.message };
  }

  if (alreadyPaid + creditCents >= invoice.total_cents) {
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: paidAt,
        sent_at: invoice.sent_at ?? paidAt,
        stripe_checkout_session_id: session.id,
        stripe_pay_url: null,
      })
      .eq("id", invoiceId)
      .eq("company_id", companyId);
    if (updateError) return { ok: false, error: updateError.message };
  }

  return { ok: true, action: "updated" };
}

export const CUSTOMER_INVOICE_CHECKOUT_PURPOSE = PURPOSE;
