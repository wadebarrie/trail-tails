#!/usr/bin/env bash
# Fetch Supabase API keys into .env.local using the Supabase CLI.
# Prerequisite: run `npx supabase login` once (opens browser; token stored locally).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="wvriybvnsjfhlsnwkqrv"
ENV_FILE="$ROOT/.env.local"

if ! npx supabase projects api-keys --project-ref "$PROJECT_REF" --output json > /tmp/supabase-keys.json 2>/dev/null; then
  echo "Not logged in. Run this first:"
  echo "  npx supabase login"
  echo ""
  echo "That opens a browser and stores your personal access token locally"
  echo "(~/.config/supabase/access-token). It is NOT the anon or service role key."
  exit 1
fi

node <<'NODE'
const fs = require("fs");
const keys = JSON.parse(fs.readFileSync("/tmp/supabase-keys.json", "utf8"));

const envFile = ".env.local";
const lines = fs.existsSync(envFile)
  ? fs.readFileSync(envFile, "utf8").split("\n")
  : [];
const env = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

for (const entry of keys) {
  if (entry.name === "anon" || entry.name === "anon key") {
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = entry.api_key;
  }
  if (entry.name === "service_role" || entry.name === "service_role key") {
    env.SUPABASE_SERVICE_ROLE_KEY = entry.api_key;
  }
}

const publishable = keys.find((k) =>
  String(k.api_key || "").startsWith("sb_publishable_")
);
if (publishable && !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishable.api_key;
}

const out = fs.existsSync(envFile)
  ? fs
      .readFileSync(envFile, "utf8")
      .split("\n")
      .filter((line) => {
        const key = line.split("=")[0]?.trim();
        return ![
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ].includes(key);
      })
  : [];

if (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  out.push(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`);
}
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  out.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
}
if (env.SUPABASE_SERVICE_ROLE_KEY) {
  out.push(`SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY}`);
}

fs.writeFileSync(envFile, out.filter(Boolean).join("\n") + "\n");
console.log("Updated .env.local with API keys from Supabase CLI");
NODE

rm -f /tmp/supabase-keys.json
