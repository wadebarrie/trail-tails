# Authentication & beta onboarding

PackRoute is **invite-only** during beta. Public signup is disabled in Supabase Auth.

## Roles

| Role | Access |
|------|--------|
| **Admin** | `/dashboard` — office dashboard |
| **Driver** | `/today`, `/tomorrow`, `/help` — mobile driver view |
| **Admin + driver** | Same person, one email: `role=admin` and `can_drive=true` — dashboard plus Driver view / `/today` |
| **Platform owner** | `/owner` — create beta companies and send invites (you) |

Role comes from `profiles.role`. Company admins are created with `can_drive=true` by default so they can also run routes without a second account. Middleware enforces route access.

## Beta flow (new companies)

1. **Platform owner** signs in at `/login` and opens **Owner** (`/owner`).
2. Fill in company name, admin name/email, timezone → **Create company & invite**.
3. Copy the one-time invite URL and send it to the new admin.
4. Admin opens `/signup?token=…`, sets a password (12+ chars, letter + number).
5. Admin signs in at `/login` and completes **email OTP** (one-time code) — no authenticator app required.
6. On later logins, admin enters password then the email code again (or an authenticator code if they previously enrolled TOTP).

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

**Economics:** Company subscriptions live in `subscriptions` (plan, status, trial dates, Stripe IDs). Platform owners can edit plans manually on `/owner/companies/[id]`. Paying customers use Stripe Checkout / Customer Portal; webhooks sync status. Margin estimates use `/owner/settings` cost assumptions.

**Migration:** `20250627160000_platform_analytics.sql` adds `companies.plan_tier`, `status`, `monthly_subscription_cents`, `trial_ends_at`, and `platform_cost_assumptions`.

## Admin MFA (email OTP)

- Required for **admin** accounts only (drivers skip MFA).
- Default second factor: **email one-time code** via Supabase Auth (`signInWithOtp` / `verifyOtp`).
- Optional: existing **TOTP** authenticator enrollments still work (“Use authenticator app instead”).
- App marks the browser session MFA-satisfied with an httpOnly cookie (`packroute_admin_mfa`) after a successful email OTP.
- Supabase Dashboard → **Authentication → Email**: Magic Link template must include `{{ .Token }}` so OTP codes are sent (not only a magic link). See [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
- Set **Site URL** / redirect allow-list for each deploy environment.

### Optional cookie secret

```bash
# Strong random; falls back to hashing the service role key if unset
ADMIN_MFA_COOKIE_SECRET=
```

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
| `NEXT_PUBLIC_APP_URL` | Base URL for invite links (e.g. `https://packroute.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — invite acceptance, owner provisioning |

## Sign-in URLs

- Admin → `/login` → `/dashboard` (after MFA)
- Driver → `/login?role=driver` → `/today`
- Invite signup → `/signup?token=…` (public, token required)
- Forgot password → `/forgot-password` → email link → `/reset-password`

## Password reset

Users can request a reset from **Forgot password?** on the login page. Supabase sends the email; the link returns through `/auth/callback` to `/reset-password`.

**Supabase setup required:**

1. **Authentication → URL Configuration** — Site URL `https://packroute.app`
2. **Redirect URLs** — include `https://packroute.app/auth/callback` (and `http://localhost:3000/auth/callback` for local dev)
3. **Authentication → Email** — configure SMTP or use Supabase default mail for reset emails

After reset, users sign in again. Admins must complete MFA as usual.
