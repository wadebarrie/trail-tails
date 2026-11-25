import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Case = { name: string; pass: boolean };

function assert(name: string, condition: boolean): Case {
  return { name, pass: condition };
}

const sql = readFileSync(
  resolve("supabase/migrations/20261125150000_supabase_advisor_hardening.sql"),
  "utf8"
);
const checklist = readFileSync(
  resolve("docs/production-deployment-checklist.md"),
  "utf8"
);

const triggerOnly = ["handle_new_user()", "create_default_subscription_for_company()"];
const rlsHelpers = [
  "user_company_id()",
  "user_role()",
  "is_admin()",
  "is_active_driver()",
  "is_platform_owner()",
  "company_today(uuid)",
];

const cases: Case[] = [
  assert(
    "set_updated_at pins an empty search_path",
    sql.includes("FUNCTION public.set_updated_at()") &&
      sql.includes("SET search_path = ''") &&
      sql.includes("pg_catalog.now()")
  ),
  ...triggerOnly.map((fn) =>
    assert(
      `${fn} is revoked from anon and authenticated`,
      sql.includes(
        `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated, authenticator`
      )
    )
  ),
  assert(
    "auth trigger can still run handle_new_user",
    sql.includes("GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin")
  ),
  assert(
    "company insert trigger can still run for the service role",
    sql.includes(
      "GRANT EXECUTE ON FUNCTION public.create_default_subscription_for_company() TO service_role"
    )
  ),
  ...rlsHelpers.map((fn) =>
    assert(
      `${fn} stays executable by authenticated and not by anon`,
      sql.includes(`REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticator`) &&
        sql.includes(`GRANT EXECUTE ON FUNCTION public.${fn} TO authenticated, service_role`) &&
        !sql.includes(
          `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated, authenticator`
        )
    )
  ),
  assert(
    "stripe webhook table is an explicit deny for API roles",
    sql.includes("CREATE POLICY stripe_webhook_events_deny_api") &&
      sql.includes("TO anon, authenticated") &&
      sql.includes("USING (false)") &&
      sql.includes("WITH CHECK (false)")
  ),
  assert(
    "migration does not change existing rows",
    !/\b(insert|update|delete)\s+into\b/i.test(sql) &&
      !/\bupdate\s+public\./i.test(sql) &&
      !/\bdelete\s+from\b/i.test(sql)
  ),
  assert(
    "launch checklist still requires leaked password protection",
    checklist.includes("Leaked password protection = ON")
  ),
];

const failed = cases.filter((c) => !c.pass);
if (failed.length > 0) {
  console.error("Supabase hardening tests failed:");
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  process.exit(1);
}

console.log(`All ${cases.length} Supabase hardening tests passed.`);
