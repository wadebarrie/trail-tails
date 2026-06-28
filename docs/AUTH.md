# Authentication & beta onboarding

PackRoute is **invite-only** during beta. Public signup is disabled in Supabase Auth.

## Roles

| Role | Access |
|------|--------|
| **Admin** | `/dashboard` — office dashboard |
| **Driver** | `/today`, `/tomorrow`, `/help` — mobile driver view |
| **Platform owner** | `/owner` — create beta companies and send invites (you) |

Role comes from `profiles.role`. Middleware enforces route access.

## Beta flow (new companies)

1. **Platform owner** signs in at `/login` and opens **Owner** (`/owner`).
2. Fill in company name, admin name/email, timezone → **Create company & invite**.
3. Copy the one-time invite URL and send it to the new admin.
4. Admin opens `/signup?token=…`, sets a password (12+ chars, letter + number).
5. Admin signs in at `/login` and completes **TOTP MFA** setup on first login.
6. On later logins, admin enters password then authenticator code.

Invites expire after **7 days** and can only be used once.

## Platform owner (local dev)

After running the seed script, `admin@trailtails.test` has `is_platform_owner = true`:

```bash
node scripts/seed-test-users.mjs
```

Sign in → **Owner** link in the admin header → `/owner` (superadmin dashboard).

Apply migrations if you haven't yet:

```bash
npx supabase db push
```

## Superadmin usage dashboard (`/owner`)

Platform-owner only (not visible to tenant admins). Uses service-role queries — never exposed to tenant RLS.

| Route | Purpose |
|-------|---------|
| `/owner` | Overview — KPI cards, trends, alerts, company usage table |
| `/owner/companies/[id]` | Per-tenant detail, plan editing, recent events |
| `/owner/events` | Cross-tenant SMS / notification / system log feed |
| `/owner/provision` | Beta company invites + **onboarding guide** |
| `/owner/settings` | Configurable cost assumptions (SMS, ETA, infra) |

**Metrics source:** Aggregated from existing tables (`sms_messages`, `notification_log`, `hikes`/`stops`, `dogs`, `profiles`, `system_logs`). ETA count uses `en_route` notifications as a proxy until dedicated API metering exists.

**Economics:** Set monthly subscription per company on the detail page (cents, no Stripe). Margin = subscription − estimated COGS from `/owner/settings` assumptions.

**Migration:** `20250627160000_platform_analytics.sql` adds `companies.plan_tier`, `status`, `monthly_subscription_cents`, `trial_ends_at`, and `platform_cost_assumptions`.

## Admin MFA (TOTP)

- Required for **admin** accounts only (drivers skip MFA).
- Enroll at `/dashboard/mfa` (redirected automatically if not set up).
- Uses Supabase Auth MFA (`totp` factor type).
- Enable MFA in **Supabase Dashboard → Authentication → MFA** for production.

## Manual user creation (legacy / emergencies)

You can still create users via Supabase Dashboard + user metadata if needed:

```json
{
  "company_id": "<company-uuid>",
  "role": "admin",
  "full_name": "Office Admin"
}
```

The `handle_new_user` trigger creates the `profiles` row automatically.

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Base URL for invite links (e.g. `https://packroute.netlify.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — invite acceptance, owner provisioning |

## Sign-in URLs

- Admin → `/login` → `/dashboard` (after MFA)
- Driver → `/login?role=driver` → `/today`
- Invite signup → `/signup?token=…` (public, token required)
