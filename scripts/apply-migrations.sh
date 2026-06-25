#!/usr/bin/env bash
# Apply Supabase migrations + seed to remote database.
# Requires .env.local with DATABASE_URL or SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

PROJECT_REF="wvriybvnsjfhlsnwkqrv"
MIGRATIONS_DIR="$ROOT/supabase/migrations"

# Build DATABASE_URL with URL-encoded password (handles / and other special chars)
build_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]] && [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    return
  fi
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    return
  fi
  local user="${SUPABASE_DB_USER:-postgres}"
  local host="${SUPABASE_DB_HOST:-db.${PROJECT_REF}.supabase.co}"
  local port="${SUPABASE_DB_PORT:-5432}"
  local encoded
  encoded="$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$SUPABASE_DB_PASSWORD")"
  DATABASE_URL="postgresql://${user}:${encoded}@${host}:${port}/postgres"
}

build_database_url

apply_via_psql() {
  if ! command -v psql >/dev/null 2>&1; then
    echo "Error: psql not found. Install PostgreSQL client or use Supabase CLI path."
    exit 1
  fi

  echo "Applying migrations via psql..."
  for f in "$MIGRATIONS_DIR"/*.sql; do
    echo "  → $(basename "$f")"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
  echo "Done."
}

apply_via_supabase_cli() {
  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    echo "Error: Set DATABASE_URL or SUPABASE_ACCESS_TOKEN in .env.local"
    exit 1
  fi
  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Error: Set SUPABASE_DB_PASSWORD in .env.local"
    exit 1
  fi

  export SUPABASE_ACCESS_TOKEN
  echo "Linking project $PROJECT_REF..."
  npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --yes
  echo "Pushing migrations..."
  npx supabase db push --yes
  echo "Done."
}

if [[ -n "${DATABASE_URL:-}" ]]; then
  apply_via_psql
else
  apply_via_supabase_cli
fi
