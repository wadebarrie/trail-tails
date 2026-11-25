import { formatCentsDisplay } from "@/features/billing/queries";
import { isValidShareTokenShape } from "@/features/hike-photos/share";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEtransferEmail(
  raw: string | null | undefined
): { ok: true; email: string | null } | { ok: false; error: string } {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { ok: true, email: null };
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 120) {
    return { ok: false, error: "Enter a valid e-Transfer email." };
  }
  return { ok: true, email: trimmed.toLowerCase() };
}

/** Card pay stays off unless Stripe is configured for this environment. */
export function resolveShowCardPayment(
  requested: boolean,
  stripeConfigured: boolean
): boolean {
  return requested && stripeConfigured;
}

export function invoiceSendBlockReason(input: {
  etransferEmail: string | null | undefined;
  showCardPayment: boolean;
}): string | null {
  if (input.etransferEmail?.trim()) return null;
  if (input.showCardPayment) return null;
  return "Add an Interac e-Transfer email in Settings before sending. Card payment is off.";
}

export function buildInvoicePaymentMessage(input: {
  companyName: string;
  invoiceNumber: string;
  totalCents: number;
  link: string;
  etransferEmail: string | null | undefined;
}): string {
  const amount = formatCentsDisplay(input.totalCents);
  const company = input.companyName.trim() || "PackRoute";
  const pay = input.etransferEmail?.trim()
    ? ` Pay by e-Transfer to ${input.etransferEmail.trim()}.`
    : "";
  return `${company} Invoice #${input.invoiceNumber} for ${amount} is ready: ${input.link}.${pay}`;
}

export function buildInvoicePublicUrl(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/$/, "")}/i/${token}`;
}

export function isInvoiceToken(token: string): boolean {
  return isValidShareTokenShape(token);
}

/** Difference between total and subtotal, when the invoice stored tax in the total. */
export function invoiceTaxCents(subtotalCents: number, totalCents: number): number | null {
  if (totalCents > subtotalCents) return totalCents - subtotalCents;
  return null;
}

export function publicInvoicePaymentState(input: {
  status: string;
  etransferEmail: string | null | undefined;
  showCardPayment: boolean;
  payUrl: string | null | undefined;
}): { paid: boolean; showEtransfer: boolean; showCard: boolean } {
  const paid = input.status === "paid";
  return {
    paid,
    showEtransfer: !paid && Boolean(input.etransferEmail?.trim()),
    showCard: !paid && input.showCardPayment && Boolean(input.payUrl?.trim()),
  };
}
