import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COMMON_TIMEZONES } from "@/features/platform/timezones";
import {
  friendlySignupError,
  pricingAnswerForSignup,
  signupEmailConflict,
  SIGNUP_DRIVER_EMAIL_ERROR,
  SIGNUP_GENERIC_ERROR,
  SIGNUP_PENDING_INVITE_ERROR,
  SIGNUP_SIGN_IN_ERROR,
} from "@/features/onboarding/signup-polish";

const settings = readFileSync(resolve("src/features/platform/settings.ts"), "utf8");
const migration = readFileSync(
  resolve("supabase/migrations/20261125190000_company_province.sql"),
  "utf8"
);

const cases: { name: string; pass: boolean }[] = [
  {
    name: "public self-signup stays off by default",
    pass: settings.includes("self_signup_enabled: false"),
  },
  {
    name: "raw database errors become a friendly signup message",
    pass:
      friendlySignupError('relation "pending_self_signups" does not exist') ===
        SIGNUP_GENERIC_ERROR &&
      friendlySignupError("{}") === SIGNUP_GENERIC_ERROR,
  },
  {
    name: "a taken email points to sign in",
    pass: friendlySignupError("User already registered") === SIGNUP_SIGN_IN_ERROR,
  },
  {
    name: "our own invite message is left intact",
    pass: friendlySignupError(SIGNUP_PENDING_INVITE_ERROR) === SIGNUP_PENDING_INVITE_ERROR,
  },
  {
    name: "a pending invite blocks a second company",
    pass:
      signupEmailConflict({ pendingInvite: true, existingRole: null }) ===
      SIGNUP_PENDING_INVITE_ERROR,
  },
  {
    name: "a driver email explains the one-company rule",
    pass:
      signupEmailConflict({ pendingInvite: false, existingRole: "driver" }) ===
      SIGNUP_DRIVER_EMAIL_ERROR,
  },
  {
    name: "trial copy replaces the demo-only FAQ only when signup is open",
    pass:
      pricingAnswerForSignup(
        "Is the first month really free?",
        "After a short demo we set up your company",
        false
      ).includes("short demo") &&
      pricingAnswerForSignup(
        "Is the first month really free?",
        "After a short demo we set up your company",
        true
      ).includes("free trial") &&
      !pricingAnswerForSignup(
        "Is the first month really free?",
        "After a short demo we set up your company",
        true
      ).includes("short demo"),
  },
  {
    name: "Canadian timezones include Regina, St. John's, and Whitehorse",
    pass: ["America/Regina", "America/St_Johns", "America/Whitehorse"].every((zone) =>
      COMMON_TIMEZONES.some((item) => item.value === zone)
    ),
  },
  {
    name: "province migration does not rewrite existing rows",
    pass:
      migration.includes("ADD COLUMN IF NOT EXISTS province") &&
      !/\bUPDATE\b/i.test(migration) &&
      !/\bDELETE\b/i.test(migration),
  },
];

const failed = cases.filter((item) => !item.pass);
if (failed.length) {
  console.error("Signup polish tests failed:");
  for (const item of failed) console.error(`  ✗ ${item.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} signup polish tests passed.`);
