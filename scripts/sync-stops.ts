/**
 * Sync hikes/stops for given dates. Requires .env.local with service role.
 * Usage: npx tsx scripts/sync-stops.ts 2026-06-25 2026-06-26
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { syncStopsForDate } from "../src/features/hikes/sync-stops";

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

const COMPANY_ID = "a0000000-0000-0000-0000-000000000001";
const dates = process.argv.slice(2);

if (!dates.length) {
  console.error("Usage: npx tsx scripts/sync-stops.ts YYYY-MM-DD ...");
  process.exit(1);
}

async function main() {
  for (const date of dates) {
    const ids = await syncStopsForDate(COMPANY_ID, date);
    console.log(`${date}: synced ${ids.length} hike(s)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
