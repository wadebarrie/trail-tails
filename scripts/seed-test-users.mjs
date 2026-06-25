/**
 * Creates local dev test users in Supabase Auth.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage: node scripts/seed-test-users.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMPANY_ID = "a0000000-0000-0000-0000-000000000001";

export const TEST_USERS = [
  {
    email: "admin@trailtails.test",
    password: "TrailTailsDev1!",
    role: "admin",
    full_name: "Test Admin",
    can_drive: true,
  },
  {
    email: "driver@trailtails.test",
    password: "TrailTailsDev1!",
    role: "driver",
    full_name: "Test Driver",
    can_drive: false,
  },
];

async function createUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        company_id: COMPANY_ID,
        role: user.role,
        full_name: user.full_name,
        can_drive: user.can_drive ?? false,
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function syncProfileFlags(user) {
  const listRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(user.email)}`,
    {
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
    }
  );
  const listBody = await listRes.json().catch(() => ({}));
  const authUser = listBody?.users?.[0];
  if (!authUser?.id) return;

  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ can_drive: user.can_drive ?? false }),
    }
  );

  if (!patchRes.ok) {
    const body = await patchRes.json().catch(() => ({}));
    console.warn(`  ! Profile sync ${user.email}:`, body?.message || patchRes.status);
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  console.log("Creating Trail Tails test users...\n");

  for (const user of TEST_USERS) {
    const { status, body } = await createUser(user);

    if (status === 200 || status === 201) {
      console.log(`✓ Created  ${user.email} (${user.role})`);
    } else if (body?.code === "email_exists" || status === 422) {
      console.log(`· Exists   ${user.email} (${user.role})`);
    } else {
      console.error(`✗ Failed   ${user.email}:`, body?.msg || body?.message || body);
    }

    await syncProfileFlags(user);
  }

  console.log("\n--- Dev credentials ---");
  console.log("Admin:  admin@trailtails.test  /  TrailTailsDev1!  (admin + driver view)");
  console.log("Driver: driver@trailtails.test /  TrailTailsDev1!");
  console.log("\nSign in at http://localhost:3000/login");
}

main();
