#!/usr/bin/env bash
# Normalize .env.local: fix DATABASE_URL encoding, alias publishable → anon key.
# Does not print secret values.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env.local not found"
  exit 1
fi

node <<'NODE'
const fs = require("fs");
const path = require("path");

const envFile = path.join(process.cwd(), ".env.local");
const lines = fs.readFileSync(envFile, "utf8").split("\n");
const env = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const projectRef = "wvriybvnsjfhlsnwkqrv";
const password = env.SUPABASE_DB_PASSWORD;
// Direct connection is reliable for migrations; pooler region varies by project
const host =
  env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
const port = env.SUPABASE_DB_PORT || "5432";
const user = env.SUPABASE_DB_USER || "postgres";

let changed = false;

if (password) {
  const encoded = encodeURIComponent(password);
  const built = `postgresql://${user}:${encoded}@${host}:${port}/postgres`;
  if (env.DATABASE_URL !== built) {
    env.DATABASE_URL = built;
    changed = true;
    console.log("Fixed DATABASE_URL (password is now URL-encoded)");
  }
}

if (!env.NEXT_PUBLIC_SUPABASE_URL) {
  env.NEXT_PUBLIC_SUPABASE_URL = `https://${projectRef}.supabase.co`;
  changed = true;
  console.log("Set NEXT_PUBLIC_SUPABASE_URL from project ref");
}

const publishable = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (
  publishable &&
  (!anon || anon.includes("your_"))
) {
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = publishable;
  changed = true;
  console.log("Set NEXT_PUBLIC_SUPABASE_ANON_KEY from publishable key");
}

if (!changed) {
  console.log("No changes needed");
  process.exit(0);
}

const keyOrder = [
  "DATABASE_URL",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_DB_HOST",
  "SUPABASE_DB_PORT",
  "SUPABASE_DB_USER",
  "SUPABASE_ACCESS_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const seen = new Set();
const out = [
  "# Trail Tails — local secrets (never commit)",
  "# Run: bash scripts/sync-env.sh to fix DATABASE_URL encoding",
  "",
];

for (const key of keyOrder) {
  if (env[key] !== undefined && !seen.has(key)) {
    seen.add(key);
    out.push(`${key}=${env[key]}`);
  }
}

for (const [key, value] of Object.entries(env)) {
  if (!seen.has(key)) {
    out.push(`${key}=${value}`);
  }
}

fs.writeFileSync(envFile, out.join("\n") + "\n");
NODE
