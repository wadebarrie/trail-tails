/**
 * Mark a hike completed (admin close-out). Usage:
 *   npx tsx scripts/complete-hike.ts <hike-id>
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServiceClient } from "../src/lib/supabase/service";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

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

const TERMINAL = new Set(["picked_up", "dropped_off", "skipped", "cancelled"]);

async function main() {
  const hikeId = process.argv[2];
  if (!hikeId) {
    console.error("Usage: npx tsx scripts/complete-hike.ts <hike-id>");
    process.exit(1);
  }

  const supabase = createServiceClient();
  const { data: hike } = await supabase
    .from("hikes")
    .select("id, status, date")
    .eq("id", hikeId)
    .maybeSingle();

  if (!hike) {
    console.error("Hike not found");
    process.exit(1);
  }
  if (hike.status === "completed") {
    console.log(`Hike ${hike.date} already completed`);
    return;
  }

  const now = new Date().toISOString();
  const { data: stops } = await supabase
    .from("stops")
    .select("id, stop_type, status")
    .eq("hike_id", hikeId);

  for (const stop of stops ?? []) {
    if (TERMINAL.has(stop.status)) continue;
    const status = stop.stop_type === "pickup" ? "picked_up" : "dropped_off";
    await supabase
      .from("stops")
      .update({ status, completed_at: now })
      .eq("id", stop.id);
  }

  await supabase.from("hikes").update({ status: "completed" }).eq("id", hikeId);
  console.log(`Completed hike ${hike.date} (${hikeId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
