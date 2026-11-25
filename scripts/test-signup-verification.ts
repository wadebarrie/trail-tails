import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  interactiveCaptchaDecision,
  isCaptchaRejection,
  pendingSignupAction,
  postAuthDestination,
  SIGNUP_EMAIL_ATTEMPT_LIMIT,
  signupCaptchaDecision,
  signupConfirmationUrl,
  signupRateLimitExceeded,
} from "@/features/auth/signup-guards";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const migration = readFileSync(
  resolve("supabase/migrations/20261125140000_pending_self_signups.sql"),
  "utf8"
);
const signupServer = readFileSync(
  resolve("src/features/onboarding/self-signup.server.ts"),
  "utf8"
);

const cases: Case[] = [
  assert(
    "self-signup off skips captcha",
    signupCaptchaDecision({
      selfSignupEnabled: false,
      siteKeyPresent: false,
      token: null,
    }).ok === true
  ),
  assert(
    "self-signup on without a site key fails closed",
    signupCaptchaDecision({
      selfSignupEnabled: true,
      siteKeyPresent: false,
      token: "token",
    }).ok === false
  ),
  assert(
    "self-signup on rejects a missing captcha token",
    signupCaptchaDecision({
      selfSignupEnabled: true,
      siteKeyPresent: true,
      token: "  ",
    }).ok === false
  ),
  assert(
    "self-signup on accepts a captcha token",
    (() => {
      const decision = signupCaptchaDecision({
        selfSignupEnabled: true,
        siteKeyPresent: true,
        token: " turnstile-token ",
      });
      return decision.ok && decision.token === "turnstile-token";
    })()
  ),
  assert(
    "login skips captcha when the site key is absent",
    interactiveCaptchaDecision({ siteKeyPresent: false, token: null }).ok === true
  ),
  assert(
    "login requires a token when the site key is set",
    interactiveCaptchaDecision({ siteKeyPresent: true, token: "" }).ok === false
  ),
  assert(
    "captcha failures are recognized",
    isCaptchaRejection("captcha protection: request disallowed") &&
      !isCaptchaRejection("Invalid login credentials")
  ),
  assert(
    "rate limit trips at the cap",
    signupRateLimitExceeded(SIGNUP_EMAIL_ATTEMPT_LIMIT, SIGNUP_EMAIL_ATTEMPT_LIMIT) &&
      !signupRateLimitExceeded(SIGNUP_EMAIL_ATTEMPT_LIMIT - 1, SIGNUP_EMAIL_ATTEMPT_LIMIT)
  ),
  assert(
    "no pending row starts a signup",
    pendingSignupAction(null, Date.now()) === "create"
  ),
  assert(
    "an open pending signup resends instead of creating another company",
    pendingSignupAction(
      {
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        hasProfile: false,
      },
      Date.now()
    ) === "resend"
  ),
  assert(
    "a consumed signup tells the owner to sign in",
    pendingSignupAction(
      {
        consumedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        hasProfile: true,
      },
      Date.now()
    ) === "sign_in"
  ),
  assert(
    "an expired pending signup can be restarted",
    pendingSignupAction(
      {
        consumedAt: null,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        hasProfile: false,
      },
      Date.now()
    ) === "restart"
  ),
  assert(
    "confirmation link lands on the wizard and counts as email MFA",
    signupConfirmationUrl("https://packroute.app") ===
      "https://packroute.app/auth/callback?next=%2Fdashboard%2Fonboarding&mfa=1"
  ),
  assert(
    "a new admin's first sign-in opens the wizard",
    postAuthDestination({
      role: "admin",
      canDrive: true,
      onboardingCompletedAt: null,
      next: "/dashboard",
    }) === "/dashboard/onboarding"
  ),
  assert(
    "a finished admin keeps their requested dashboard path",
    postAuthDestination({
      role: "admin",
      canDrive: false,
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
      next: "/dashboard/settings",
    }) === "/dashboard/settings"
  ),
  assert(
    "drivers are not sent to the admin wizard",
    postAuthDestination({
      role: "driver",
      canDrive: false,
      onboardingCompletedAt: null,
      next: "/today",
    }) === "/today"
  ),
  assert(
    "signup does not confirm the email or create a company up front",
    !signupServer.includes("email_confirm: true") &&
      !signupServer.includes('.from("companies").insert')
  ),
  assert(
    "confirmation email is sent with the captcha token",
    signupServer.includes('type: "signup"') && signupServer.includes("captchaToken")
  ),
  assert(
    "migration provisions only a confirmed user",
    migration.includes("email_confirmed_at IS NOT NULL") &&
      migration.includes("public.provision_self_signup") &&
      migration.includes("CREATE TABLE IF NOT EXISTS public.pending_self_signups")
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Signup verification tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} signup verification tests passed.`);
