import { getLoginRedirect } from "@/features/auth/access";
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
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Safe redirect tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} safe redirect tests passed.`);
