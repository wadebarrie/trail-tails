import { buildInvoicePaymentMessage } from "@/features/invoices/etransfer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InvoiceEmailSkipReason =
  | "no_recipient"
  | "test_inbox_missing"
  | "unconfigured";

export type InvoiceEmailPlan =
  | { action: "skip"; reason: InvoiceEmailSkipReason }
  | {
      action: "send";
      to: string;
      originalRecipient: string;
      redirected: boolean;
      subject: string;
      text: string;
    };

/** Invoice mail uses billing_email, then the customer's regular email. */
export function invoiceEmailRecipient(input: {
  billingEmail: string | null | undefined;
  email: string | null | undefined;
}): string | null {
  const billing = input.billingEmail?.trim() ?? "";
  if (billing) return billing;
  const email = input.email?.trim() ?? "";
  return email || null;
}

/**
 * Only an explicit live company may email the customer.
 * Null and anything else are test, so a missing mode cannot leak mail.
 */
export function invoiceEmailIsTestMode(smsMode: string | null | undefined): boolean {
  return smsMode !== "live";
}

/** True only when a live company may email the customer directly. */
export function shouldSendInvoiceEmail(input: {
  smsMode: string | null | undefined;
}): boolean {
  return !invoiceEmailIsTestMode(input.smsMode);
}

export function invoiceEmailSubject(input: {
  companyName: string;
  invoiceNumber: string;
  redirected: boolean;
  originalRecipient: string;
}): string {
  const base = `${input.companyName.trim() || "PackRoute"} invoice ${input.invoiceNumber}`;
  if (!input.redirected) return base;
  return `[TEST → ${input.originalRecipient}] ${base}`;
}

export function invoiceEmailBody(input: {
  companyName: string;
  invoiceNumber: string;
  totalCents: number;
  link: string;
  etransferEmail: string | null | undefined;
  dueDate?: string | null;
}): string {
  const message = buildInvoicePaymentMessage(input);
  const due = input.dueDate?.trim();
  if (!due) return message;
  return `${message} Due ${due}.`;
}

export function planInvoiceEmail(input: {
  smsMode: string | null | undefined;
  testEmail: string | null | undefined;
  billingEmail: string | null | undefined;
  email: string | null | undefined;
  companyName: string;
  invoiceNumber: string;
  totalCents: number;
  link: string;
  etransferEmail: string | null | undefined;
  dueDate?: string | null;
  resendConfigured: boolean;
}): InvoiceEmailPlan {
  const originalRecipient = invoiceEmailRecipient(input);
  if (!originalRecipient) return { action: "skip", reason: "no_recipient" };
  if (!input.resendConfigured) return { action: "skip", reason: "unconfigured" };

  const text = invoiceEmailBody({ ...input, dueDate: input.dueDate });
  const testMode = invoiceEmailIsTestMode(input.smsMode);
  if (testMode) {
    const testEmail = input.testEmail?.trim() ?? "";
    if (!testEmail) return { action: "skip", reason: "test_inbox_missing" };
    return {
      action: "send",
      to: testEmail,
      originalRecipient,
      redirected: true,
      subject: invoiceEmailSubject({
        companyName: input.companyName,
        invoiceNumber: input.invoiceNumber,
        redirected: true,
        originalRecipient,
      }),
      text,
    };
  }

  return {
    action: "send",
    to: originalRecipient,
    originalRecipient,
    redirected: false,
    subject: invoiceEmailSubject({
      companyName: input.companyName,
      invoiceNumber: input.invoiceNumber,
      redirected: false,
      originalRecipient,
    }),
    text,
  };
}

export function invoiceResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.WELCOME_FROM_EMAIL?.trim()
  );
}

export function invoiceEmailAvailability(input: {
  smsMode: string | null | undefined;
  testEmail: string | null | undefined;
  billingEmail: string | null | undefined;
  email: string | null | undefined;
  resendConfigured: boolean;
}): { canEmail: boolean; hint: string | null } {
  const plan = planInvoiceEmail({
    ...input,
    companyName: "PackRoute",
    invoiceNumber: "preview",
    totalCents: 0,
    link: "https://packroute.app/i/preview",
    etransferEmail: null,
  });
  if (plan.action === "send") return { canEmail: true, hint: null };
  if (plan.reason === "no_recipient") {
    return {
      canEmail: false,
      hint: "Add a billing email or customer email to email this invoice.",
    };
  }
  if (plan.reason === "test_inbox_missing") {
    return {
      canEmail: false,
      hint: "Test mode needs a test email in Settings. Until then, email is skipped.",
    };
  }
  return {
    canEmail: false,
    hint: "Invoice email isn't configured on this server yet.",
  };
}

export function defaultInvoiceChannels(input: {
  canText: boolean;
  canEmail: boolean;
}): { text: boolean; email: boolean } {
  return { text: input.canText, email: input.canEmail };
}

/** A later send of the same invoice has to be an explicit Resend. */
export function invoiceAlreadyDelivered(input: {
  status: string;
  logs: { status: string; body: string }[];
  token: string;
}): boolean {
  if (input.status === "sent" || input.status === "overdue") return true;
  const token = input.token.trim();
  if (!token) return false;
  return input.logs.some(
    (log) => log.status === "sent" && log.body.includes(token)
  );
}

export function invoiceResendRequiredMessage(input: {
  alreadyDelivered: boolean;
  resend: boolean;
}): string | null {
  if (input.alreadyDelivered && !input.resend) {
    return "This invoice was already sent. Use Resend to send it again.";
  }
  return null;
}

export function invoiceEmailLogBody(input: {
  subject: string;
  to: string;
  text: string;
}): string {
  return `Subject: ${input.subject}\nTo: ${input.to}\n${input.text}`;
}

export function parseOptionalInbox(
  raw: string | null | undefined,
  label: string
): { ok: true; email: string | null } | { ok: false; error: string } {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { ok: true, email: null };
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 120) {
    return { ok: false, error: `Enter a valid ${label}.` };
  }
  return { ok: true, email: trimmed.toLowerCase() };
}

export type InvoiceEmailSendResult =
  | { status: "sent"; to: string; subject: string; text: string; redirected: boolean }
  | { status: "skipped"; reason: InvoiceEmailSkipReason }
  | { status: "failed"; error: string; to: string; subject: string; text: string };

/** Uses the existing Resend welcome sender. Never throws. */
export async function sendInvoiceEmail(input: {
  smsMode: string | null | undefined;
  testEmail: string | null | undefined;
  billingEmail: string | null | undefined;
  email: string | null | undefined;
  companyName: string;
  invoiceNumber: string;
  totalCents: number;
  link: string;
  etransferEmail: string | null | undefined;
  dueDate?: string | null;
}): Promise<InvoiceEmailSendResult> {
  const plan = planInvoiceEmail({
    ...input,
    resendConfigured: invoiceResendConfigured(),
  });
  if (plan.action === "skip") return { status: "skipped", reason: plan.reason };

  const testMode = invoiceEmailIsTestMode(input.smsMode);
  const testInbox = input.testEmail?.trim().toLowerCase() ?? "";
  if (testMode) {
    if (!plan.redirected || plan.to.trim().toLowerCase() !== testInbox) {
      return { status: "skipped", reason: "test_inbox_missing" };
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WELCOME_FROM_EMAIL?.trim();
  if (!apiKey || !from) return { status: "skipped", reason: "unconfigured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [plan.to],
        subject: plan.subject,
        text: plan.text,
      }),
    });
    if (!response.ok) {
      return {
        status: "failed",
        error: "Email provider did not accept the invoice.",
        to: plan.to,
        subject: plan.subject,
        text: plan.text,
      };
    }
    return {
      status: "sent",
      to: plan.to,
      subject: plan.subject,
      text: plan.text,
      redirected: plan.redirected,
    };
  } catch {
    return {
      status: "failed",
      error: "Could not reach the email provider.",
      to: plan.to,
      subject: plan.subject,
      text: plan.text,
    };
  }
}
