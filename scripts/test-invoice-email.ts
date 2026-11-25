import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { importedBillingEmail } from "@/features/import/columns";
import {
  defaultInvoiceChannels,
  invoiceAlreadyDelivered,
  invoiceEmailIsTestMode,
  invoiceEmailRecipient,
  invoiceResendRequiredMessage,
  planInvoiceEmail,
  sendInvoiceEmail,
} from "@/features/invoices/invoice-email";

const migration = readFileSync(
  resolve("supabase/migrations/20261125210000_invoice_email_inboxes.sql"),
  "utf8"
);
const smsRoute = readFileSync(resolve("src/features/sms/company-sms-route.ts"), "utf8");

const base = {
  companyName: "Harbour Hikes",
  invoiceNumber: "INV-2026-0007",
  totalCents: 24000,
  link: "https://packroute.app/i/token",
  etransferEmail: "pay@example.com",
  resendConfigured: true,
};

function assert(name: string, pass: boolean) {
  if (!pass) {
    console.error(`  ✗ ${name}`);
    process.exitCode = 1;
  }
}

assert(
  "billing email falls back to the customer email",
  invoiceEmailRecipient({ billingEmail: "  Bills@Example.com ", email: "a@example.com" }) ===
    "Bills@Example.com" &&
    invoiceEmailRecipient({ billingEmail: "  ", email: " owner@example.com " }) ===
      "owner@example.com" &&
    invoiceEmailRecipient({ billingEmail: null, email: null }) === null
);

assert(
  "a blank test inbox skips email in test mode",
  planInvoiceEmail({
    ...base,
    smsMode: "test",
    testEmail: "  ",
    billingEmail: null,
    email: "customer@example.com",
  }).action === "skip"
);

const redirected = planInvoiceEmail({
  ...base,
  smsMode: "test",
  testEmail: "owner-test@example.com",
  billingEmail: "billing@example.com",
  email: "customer@example.com",
});
assert(
  "test mode redirects to the company test email and prefixes the subject",
  redirected.action === "send" &&
    redirected.to === "owner-test@example.com" &&
    redirected.to !== "billing@example.com" &&
    redirected.subject.startsWith("[TEST → billing@example.com]")
);

const nullMode = planInvoiceEmail({
  ...base,
  smsMode: null,
  testEmail: "owner-test@example.com",
  billingEmail: null,
  email: "customer@example.com",
});
assert(
  "a null sms mode is treated as test for email",
  invoiceEmailIsTestMode(null) === true &&
    invoiceEmailIsTestMode(undefined) === true &&
    invoiceEmailIsTestMode("live") === false &&
    nullMode.action === "send" &&
    nullMode.to === "owner-test@example.com" &&
    nullMode.subject.startsWith("[TEST → customer@example.com]")
);

assert(
  "null mode with no test email does not mail the customer",
  planInvoiceEmail({
    ...base,
    smsMode: null,
    testEmail: null,
    billingEmail: null,
    email: "customer@example.com",
  }).action === "skip"
);

assert(
  "unconfigured Resend skips the email",
  planInvoiceEmail({
    ...base,
    smsMode: "live",
    testEmail: null,
    billingEmail: null,
    email: "customer@example.com",
    resendConfigured: false,
  }).action === "skip"
);

assert(
  "a repeat send needs an explicit resend",
  invoiceAlreadyDelivered({
    status: "draft",
    token: "token",
    logs: [{ status: "sent", body: "ready: https://packroute.app/i/token" }],
  }) === true &&
    invoiceAlreadyDelivered({
      status: "draft",
      token: "token",
      logs: [{ status: "failed", body: "https://packroute.app/i/token" }],
    }) === false &&
    invoiceAlreadyDelivered({ status: "sent", token: "", logs: [] }) === true &&
    invoiceResendRequiredMessage({ alreadyDelivered: true, resend: false }) !== null &&
    invoiceResendRequiredMessage({ alreadyDelivered: true, resend: true }) === null
);

assert(
  "channels default to whatever is available",
  defaultInvoiceChannels({ canText: true, canEmail: true }).text === true &&
    defaultInvoiceChannels({ canText: true, canEmail: true }).email === true &&
    defaultInvoiceChannels({ canText: true, canEmail: false }).email === false &&
    defaultInvoiceChannels({ canText: false, canEmail: true }).text === false
);

assert(
  "csv billing email is omitted when the column is absent",
  importedBillingEmail(["customer_email"], {}) === undefined &&
    importedBillingEmail(["customer_billing_email"], { customer_billing_email: " Bills@X.com " }) ===
      "bills@x.com" &&
    importedBillingEmail(["customer_billing_email"], { customer_billing_email: "  " }) === null
);

assert(
  "migration only adds nullable columns",
  migration.includes("customers") &&
    migration.includes("billing_email") &&
    migration.includes("test_email") &&
    !/\bUPDATE\b/i.test(migration) &&
    !/\bDELETE\b/i.test(migration)
);

assert(
  "sms routing still treats a null mode as live",
  smsRoute.includes('company?.sms_mode === "test" ? "test" : "live"')
);

async function assertProviderCalls() {
  const calls: { to: string[]; subject: string }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as { to: string[]; subject: string };
    calls.push(body);
    return new Response("{}", { status: 200 });
  };
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.WELCOME_FROM_EMAIL;
  process.env.RESEND_API_KEY = "test-key";
  process.env.WELCOME_FROM_EMAIL = "invoices@example.com";

  const sent = await sendInvoiceEmail({
    smsMode: "test",
    testEmail: "owner-test@example.com",
    billingEmail: "billing@example.com",
    email: "customer@example.com",
    companyName: "Harbour Hikes",
    invoiceNumber: "INV-2026-0007",
    totalCents: 24000,
    link: "https://packroute.app/i/token",
    etransferEmail: "pay@example.com",
  });

  const nullRedirect = await sendInvoiceEmail({
    smsMode: null,
    testEmail: "owner-test@example.com",
    billingEmail: null,
    email: "customer@example.com",
    companyName: "Harbour Hikes",
    invoiceNumber: "INV-2026-0007",
    totalCents: 24000,
    link: "https://packroute.app/i/token",
    etransferEmail: null,
  });

  delete process.env.RESEND_API_KEY;
  delete process.env.WELCOME_FROM_EMAIL;
  const unconfigured = await sendInvoiceEmail({
    smsMode: "live",
    testEmail: null,
    billingEmail: null,
    email: "customer@example.com",
    companyName: "Harbour Hikes",
    invoiceNumber: "INV-2026-0007",
    totalCents: 24000,
    link: "https://packroute.app/i/token",
    etransferEmail: "pay@example.com",
  });

  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousKey;
  if (previousFrom === undefined) delete process.env.WELCOME_FROM_EMAIL;
  else process.env.WELCOME_FROM_EMAIL = previousFrom;

  const customerNeverMailed = calls.every(
    (call) => !call.to.includes("customer@example.com") && !call.to.includes("billing@example.com")
  );
  assert(
    "the sender redirects test and null mode and skips when Resend is unset",
    sent.status === "sent" &&
      sent.to === "owner-test@example.com" &&
      calls[0]?.to[0] === "owner-test@example.com" &&
      calls[0]?.subject.startsWith("[TEST → billing@example.com]") &&
      nullRedirect.status === "sent" &&
      nullRedirect.to === "owner-test@example.com" &&
      calls[1]?.subject.startsWith("[TEST → customer@example.com]") &&
      unconfigured.status === "skipped" &&
      calls.length === 2 &&
      customerNeverMailed
  );
}

assertProviderCalls()
  .then(() => {
    if (process.exitCode) {
      console.error("Invoice email tests failed.");
      process.exit(1);
    }
    console.log("All invoice email tests passed.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
