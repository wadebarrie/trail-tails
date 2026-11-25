import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  companyOutboundTarget,
  globalSmsRedirect,
  resolveInboundTenant,
  TRIAL_DAILY_SMS_CAP,
  trialOutboundCapReached,
} from "@/features/sms/sms-policy";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const migration = readFileSync(
  resolve("supabase/migrations/20261125170000_company_sms_mode.sql"),
  "utf8"
);

const pack = {
  companyId: "pack",
  companyName: "PackRoute",
  customerId: "cust-pack",
};
const harbour = {
  companyId: "harbour",
  companyName: "Harbour Hikes",
  customerId: "cust-harbour",
};

const cases: Case[] = [
  assert(
    "production ignores the global SMS redirect",
    globalSmsRedirect({
      nodeEnv: "production",
      redirectTo: "+16045550100",
    }) === null
  ),
  assert(
    "local dev can still use the global redirect",
    globalSmsRedirect({
      nodeEnv: "development",
      redirectTo: "+16045550100",
    }) === "+16045550100"
  ),
  assert(
    "test mode sends to the owner phone",
    companyOutboundTarget({
      smsMode: "test",
      smsTestPhone: "+16045550199",
      globalRedirect: null,
    }).redirectTo === "+16045550199"
  ),
  assert(
    "test mode does not fall through to the customer",
    companyOutboundTarget({
      smsMode: "test",
      smsTestPhone: "  ",
      globalRedirect: null,
    }).blocked === "test_phone_missing"
  ),
  assert(
    "live mode uses the customer number",
    companyOutboundTarget({
      smsMode: "live",
      smsTestPhone: "+16045550199",
      globalRedirect: null,
    }).redirectTo === null
  ),
  assert(
    "trial cap blocks the next text",
    trialOutboundCapReached(TRIAL_DAILY_SMS_CAP) &&
      !trialOutboundCapReached(TRIAL_DAILY_SMS_CAP - 1)
  ),
  assert(
    "one matching company is used",
    resolveInboundTenant({
      candidates: [pack],
      latestOutboundCompanyId: null,
      body: "skip tomorrow",
    }).kind === "one"
  ),
  assert(
    "latest outbound company wins when numbers are shared",
    (() => {
      const choice = resolveInboundTenant({
        candidates: [pack, harbour],
        latestOutboundCompanyId: "harbour",
        body: "cancel tomorrow",
      });
      return choice.kind === "one" && choice.companyId === "harbour";
    })()
  ),
  assert(
    "shared numbers without a recent text ask which company",
    (() => {
      const choice = resolveInboundTenant({
        candidates: [pack, harbour],
        latestOutboundCompanyId: null,
        body: "cancel tomorrow",
      });
      return choice.kind === "ask" && choice.reply.includes("Harbour Hikes");
    })()
  ),
  assert(
    "replying with the company name picks that tenant",
    (() => {
      const choice = resolveInboundTenant({
        candidates: [pack, harbour],
        latestOutboundCompanyId: null,
        body: "Harbour Hikes",
      });
      return choice.kind === "one" && choice.companyId === "harbour";
    })()
  ),
  assert(
    "unknown numbers are not assigned a default company",
    resolveInboundTenant({
      candidates: [],
      latestOutboundCompanyId: "pack",
      body: "help",
    }).kind === "none"
  ),
  assert(
    "migration sets the seed company to test mode and indexes phones",
    migration.includes("a0000000-0000-0000-0000-000000000001") &&
      migration.includes("sms_mode = 'test'") &&
      migration.includes("to_phone_key") &&
      migration.includes("phone_key")
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("SMS policy tests failed:");
  for (const item of failed) console.error(`  ✗ ${item.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} SMS policy tests passed.`);
