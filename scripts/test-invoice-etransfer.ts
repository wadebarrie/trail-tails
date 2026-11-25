import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildInvoicePaymentMessage,
  invoiceSendBlockReason,
  invoiceTaxCents,
  parseEtransferEmail,
  publicInvoicePaymentState,
  resolveShowCardPayment,
} from "@/features/invoices/etransfer";
import { sendInvoiceEmail, shouldSendInvoiceEmail } from "@/features/invoices/invoice-email";
import { companyOutboundTarget } from "@/features/sms/sms-policy";

const sendAction = readFileSync(resolve("src/features/invoices/actions.ts"), "utf8");
const migration = readFileSync(
  resolve("supabase/migrations/20261125200000_invoice_etransfer.sql"),
  "utf8"
);

const cases: { name: string; pass: boolean }[] = [
  {
    name: "e-Transfer email is validated and optional",
    pass:
      parseEtransferEmail("  Pay@Example.com ").email === "pay@example.com" &&
      parseEtransferEmail("").email === null &&
      parseEtransferEmail("not-an-email").ok === false,
  },
  {
    name: "card payment stays off unless Stripe is configured",
    pass:
      resolveShowCardPayment(true, false) === false &&
      resolveShowCardPayment(true, true) === true &&
      resolveShowCardPayment(false, true) === false,
  },
  {
    name: "sending is blocked without e-Transfer email when card pay is off",
    pass:
      invoiceSendBlockReason({
        etransferEmail: null,
        showCardPayment: false,
      }) !== null &&
      invoiceSendBlockReason({
        etransferEmail: "pay@example.com",
        showCardPayment: false,
      }) === null,
  },
  {
    name: "the text names the company, amount, link, and e-Transfer address",
    pass: buildInvoicePaymentMessage({
      companyName: "Harbour Hikes",
      invoiceNumber: "INV-2026-0007",
      totalCents: 24000,
      link: "https://packroute.app/i/token",
      etransferEmail: "pay@example.com",
    }).includes(
      "Harbour Hikes Invoice #INV-2026-0007 for CA$240.00 is ready: https://packroute.app/i/token. Pay by e-Transfer to pay@example.com."
    ),
  },
  {
    name: "a paid invoice hides payment instructions",
    pass:
      publicInvoicePaymentState({
        status: "paid",
        etransferEmail: "pay@example.com",
        showCardPayment: true,
        payUrl: "https://pay.example",
      }).paid === true &&
      publicInvoicePaymentState({
        status: "paid",
        etransferEmail: "pay@example.com",
        showCardPayment: true,
        payUrl: "https://pay.example",
      }).showEtransfer === false &&
      publicInvoicePaymentState({
        status: "paid",
        etransferEmail: "pay@example.com",
        showCardPayment: true,
        payUrl: "https://pay.example",
      }).showCard === false,
  },
  {
    name: "the card button needs the toggle and a pay link",
    pass:
      publicInvoicePaymentState({
        status: "sent",
        etransferEmail: "pay@example.com",
        showCardPayment: true,
        payUrl: null,
      }).showCard === false &&
      publicInvoicePaymentState({
        status: "sent",
        etransferEmail: "pay@example.com",
        showCardPayment: true,
        payUrl: "https://pay.example",
      }).showCard === true,
  },
  {
    name: "tax is shown only when the total is higher than the subtotal",
    pass: invoiceTaxCents(20000, 24000) === 4000 && invoiceTaxCents(24000, 24000) === null,
  },
  {
    name: "test mode skips the invoice email",
    pass:
      shouldSendInvoiceEmail({ smsMode: "test" }) === false &&
      shouldSendInvoiceEmail({ smsMode: "live" }) === true &&
      shouldSendInvoiceEmail({ smsMode: null }) === true,
  },
  {
    name: "send uses the existing SMS path so test mode still redirects",
    pass:
      sendAction.includes('notificationType: "invoice"') &&
      sendAction.includes("logNotification(") &&
      !sendAction.includes("sendSms(") &&
      companyOutboundTarget({
        smsMode: "test",
        smsTestPhone: "+16045550199",
        globalRedirect: null,
      }).redirectTo === "+16045550199",
  },
  {
    name: "migration only adds columns and does not rewrite rows",
    pass:
      migration.includes("etransfer_email") &&
      migration.includes("public_token") &&
      migration.includes("show_card_payment boolean NOT NULL DEFAULT false") &&
      !/\bUPDATE\b/i.test(migration) &&
      !/\bDELETE\b/i.test(migration),
  },
];

const failed = cases.filter((item) => !item.pass);
if (failed.length) {
  console.error("Invoice e-Transfer tests failed:");
  for (const item of failed) console.error(`  ✗ ${item.name}`);
  process.exit(1);
}

async function assertTestModeSkipsEmail() {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.WELCOME_FROM_EMAIL;
  process.env.RESEND_API_KEY = "test-key";
  process.env.WELCOME_FROM_EMAIL = "invoices@example.com";
  const testModeEmail = await sendInvoiceEmail({
    to: "customer@example.com",
    companyName: "Harbour Hikes",
    invoiceNumber: "INV-2026-0007",
    totalCents: 24000,
    link: "https://packroute.app/i/token",
    etransferEmail: "pay@example.com",
    smsMode: "test",
  });
  if (previousKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previousKey;
  if (previousFrom === undefined) delete process.env.WELCOME_FROM_EMAIL;
  else process.env.WELCOME_FROM_EMAIL = previousFrom;

  if (testModeEmail !== "skipped") {
    console.error("test mode invoice email was not skipped");
    process.exit(1);
  }
}

assertTestModeSkipsEmail()
  .then(() => {
    console.log(`All ${cases.length + 1} invoice e-Transfer tests passed.`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
