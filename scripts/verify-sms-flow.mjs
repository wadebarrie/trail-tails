/**
 * Verify pending request + related rows after inbound SMS / approve flow.
 * Usage: node scripts/verify-sms-flow.mjs [pending_request_id]
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
const requestId = process.argv[2];

let query = supabase
  .from("pending_requests")
  .select(
    `
    id,
    raw_body,
    command_type,
    status,
    parsed_payload,
    created_at,
    resolved_at,
    customers ( owner_name, phone )
  `
  )
  .order("created_at", { ascending: false })
  .limit(5);

if (requestId) {
  query = supabase
    .from("pending_requests")
    .select(
      `
      id,
      raw_body,
      command_type,
      status,
      parsed_payload,
      created_at,
      resolved_at,
      customers ( owner_name, phone )
    `
    )
    .eq("id", requestId)
    .maybeSingle();
}

const { data, error } = await query;

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

const rows = Array.isArray(data) ? data : data ? [data] : [];

if (!rows.length) {
  console.log("No pending requests found.");
  process.exit(0);
}

console.log("=== Pending requests ===\n");
for (const row of rows) {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
  console.log(`ID:      ${row.id}`);
  console.log(`Customer:${customer?.owner_name ?? "?"} (${customer?.phone ?? "?"})`);
  console.log(`Body:    ${row.raw_body}`);
  console.log(`Command: ${row.command_type}`);
  console.log(`Status:  ${row.status}`);
  console.log(`Payload: ${JSON.stringify(row.parsed_payload)}`);
  console.log(`Created: ${row.created_at}`);
  if (row.resolved_at) console.log(`Resolved:${row.resolved_at}`);
  console.log("---");

  if (row.status === "approved") {
    const { data: exceptions } = await supabase
      .from("schedule_exceptions")
      .select("id, dog_id, exception_type, start_date, end_date")
      .eq("pending_request_id", row.id);

    console.log(`Schedule exceptions (${exceptions?.length ?? 0}):`);
    for (const ex of exceptions ?? []) {
      console.log(
        `  ${ex.exception_type} ${ex.start_date}${ex.end_date && ex.end_date !== ex.start_date ? ` → ${ex.end_date}` : ""}`
      );
    }

    const targetDate = row.parsed_payload?.target_date;
    if (targetDate) {
      const { data: hike } = await supabase
        .from("hikes")
        .select("id")
        .eq("date", targetDate)
        .maybeSingle();

      if (hike) {
        const { data: stops } = await supabase
          .from("stops")
          .select("id, status, stop_type, dogs ( name )")
          .eq("hike_id", hike.id);

        console.log(`\nStops on ${targetDate}:`);
        for (const stop of stops ?? []) {
          const dog = Array.isArray(stop.dogs) ? stop.dogs[0] : stop.dogs;
          console.log(`  ${dog?.name ?? "?"} ${stop.stop_type}: ${stop.status}`);
        }
      }
    }
    console.log("---");
  }
}

console.log("\nAdmin UI: http://localhost:3000/dashboard/pending-requests");
