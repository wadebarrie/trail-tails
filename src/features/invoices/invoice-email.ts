import { buildInvoicePaymentMessage } from "@/features/invoices/etransfer";

/** Test companies must not email a real customer. Live companies still need Resend. */
export function shouldSendInvoiceEmail(input: {
  smsMode: string | null | undefined;
}): boolean {
  return input.smsMode !== "test";
}

/** Uses the existing Resend welcome sender. Skips when it is not configured or the company is in test mode. */
export async function sendInvoiceEmail(input: {
  to: string;
  companyName: string;
  invoiceNumber: string;
  totalCents: number;
  link: string;
  etransferEmail: string | null;
  smsMode: string | null | undefined;
}): Promise<"sent" | "skipped"> {
  if (!shouldSendInvoiceEmail(input)) return "skipped";
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WELCOME_FROM_EMAIL?.trim();
  const to = input.to.trim();
  if (!apiKey || !from || !to) return "skipped";

  const text = buildInvoicePaymentMessage(input);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `${input.companyName.trim() || "PackRoute"} invoice ${input.invoiceNumber}`,
        text,
      }),
    });
    return response.ok ? "sent" : "skipped";
  } catch {
    return "skipped";
  }
}
