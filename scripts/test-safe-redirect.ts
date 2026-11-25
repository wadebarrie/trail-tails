import { getLoginRedirect } from "@/features/auth/access";
import { authCallbackDestination } from "@/features/auth/signup-guards";
import { safeAuthNextPath } from "@/lib/auth/safe-redirect";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const adminProfile = { role: "admin" as const, can_drive: true, is_active: true };
const driverProfile = { role: "driver" as const, can_drive: false, is_active: true };

const cases: Case[] = [
  assert(
    "blocks protocol-relative redirect",
    safeAuthNextPath("//evil.com", "/login") === "/login",
  ),
  assert(
    "allows dashboard path",
    safeAuthNextPath("/dashboard/settings", "/login") === "/dashboard/settings",
  ),
  assert(
    "admin can use dashboard next",
    getLoginRedirect(adminProfile, "/dashboard/billing") === "/dashboard/billing",
  ),
  assert(
    "driver cannot use dashboard next",
    getLoginRedirect(driverProfile, "/dashboard/billing") === "/today",
  ),
  assert(
    "driver can use today next",
    getLoginRedirect(driverProfile, "/today") === "/today",
  ),
  assert(
    "driver cannot use owner next",
    getLoginRedirect(driverProfile, "/owner") === "/today",
  ),
  assert(
    "admin recovery callback lands on reset-password",
    authCallbackDestination({
      role: "admin",
      canDrive: true,
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
      nextParam: "/reset-password",
      fallback: "/dashboard",
    }) === "/reset-password",
  ),
  assert(
    "driver recovery callback lands on reset-password",
    authCallbackDestination({
      role: "driver",
      canDrive: false,
      onboardingCompletedAt: null,
      nextParam: "/reset-password",
      fallback: "/today",
    }) === "/reset-password",
  ),
  assert(
    "unfinished admin recovery callback lands on reset-password",
    authCallbackDestination({
      role: "admin",
      canDrive: true,
      onboardingCompletedAt: null,
      nextParam: "/reset-password",
      fallback: "/dashboard",
    }) === "/reset-password",
  ),
  assert(
    "protocol-relative reset path is not a recovery redirect",
    authCallbackDestination({
      role: "admin",
      canDrive: true,
      onboardingCompletedAt: null,
      nextParam: "//evil.com/reset-password",
      fallback: "/dashboard",
    }) === "/dashboard/onboarding",
  ),
  assert(
    "lookalike reset path stays off the reset form",
    getLoginRedirect(adminProfile, "/reset-password-extra") === "/dashboard",
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Safe redirect tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} safe redirect tests passed.`);
