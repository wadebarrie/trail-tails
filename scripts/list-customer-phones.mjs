/**
 * List active customer phones for inbound SMS testing.
 * Usage: node scripts/list-customer-phones.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from("customers")
  .select("owner_name, phone, secondary_owner_name, secondary_phone, is_active")
  .eq("is_active", true)
  .order("owner_name");

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

if (!data?.length) {
  console.log("No active customers found. Add one in Dashboard → Customers.");
  process.exit(0);
}

console.log("Active customers (use --from with one of these phones):\n");
for (const c of data) {
  console.log(`  ${c.owner_name.padEnd(20)} ${c.phone}`);
  if (c.secondary_phone) {
    console.log(
      `  ${(c.secondary_owner_name ?? "Second contact").padEnd(20)} ${c.secondary_phone}`
    );
  }
}

console.log('\nExample: npm run test:inbound-sms -- --from "' + data[0].phone + '" "SKIP TOMORROW"');
