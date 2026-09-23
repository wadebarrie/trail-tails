# PackRoute environments & branching

Three long-lived branches map to three hosted environments:

| Branch | Environment | Audience | Suggested URL |
|--------|-------------|----------|----------------|
| `staging` | Staging | You / engineering | `https://staging.packroute.app` |
| `beta` | Beta / release preview | Invite-only beta companies | `https://beta.packroute.app` |
| `main` | Production | Live customers | `https://packroute.app` |

Local development uses `.env.local` and is not a Git branch.

---

## Promotion flow

```
feature/*  ──PR──►  staging  ──PR──►  beta  ──PR──►  main
                       │                │              │
                   Netlify deploy   Netlify deploy  Netlify deploy
                   (staging site)   (beta site)     (production)
```

1. **Build on a feature branch** (`feature/…` or `fix/…`). Open a PR **into `staging`**.
2. **Promote to beta** when staging looks good: PR **`staging` → `beta`** (or merge + fast-forward). Beta testers use the beta URL only.
3. **Promote to production** when beta is signed off: PR **`beta` → `main`**.

Do **not** merge feature PRs straight into `main` once this workflow is live.

Hotfixes: branch from `main`, PR into `main`, then cherry-pick or merge back into `beta` and `staging` so lines do not diverge.

---

## What each environment should use

| Concern | Staging | Beta | Production (`main`) |
|---------|---------|------|---------------------|
| `PACKROUTE_APP_ENV` | `staging` | `beta` | `production` |
| `NEXT_PUBLIC_APP_URL` | staging URL | beta URL | `https://packroute.app` |
| Supabase | Dedicated non-prod project (recommended) **or** shared with care | Same as staging **or** separate beta project | Production project only |
| Twilio webhook | staging `/api/webhooks/twilio` | beta webhook URL | `https://packroute.app/api/webhooks/twilio` |
| SMS redirect | On by default when `TWILIO_SMS_REDIRECT_TO` is set | Same | Off unless `TWILIO_ALLOW_SMS_REDIRECT=true` |
| Stripe | Test mode | Test mode (or limited live) | Live mode |
| Cron / night-before | Optional (own `CRON_SECRET`) | Optional | Required |
| Search indexing | Blocked (`robots` noindex) | Blocked | Allowed |

Set `PACKROUTE_APP_ENV` in Netlify **per context / branch** (also set in `netlify.toml` contexts as a default).

---

## Netlify

Recommended setup (one site is enough if you use branch deploys + domain aliases):

1. **Production branch:** `main` → `packroute.app`
2. **Branch deploys:** enable for `staging` and `beta`
3. **Domain aliases:**
   - `staging.packroute.app` → branch `staging`
   - `beta.packroute.app` → branch `beta`
4. **Environment variables:** scope by deploy context / branch:
   - Production context → production Supabase + Twilio + Stripe live
   - `staging` / `beta` contexts → non-prod keys, SMS redirect, test Stripe

Scheduled night-before cron should target **production** only unless you intentionally want beta reminders.

---

## Supabase

**Preferred:** one Supabase project for production, a second for staging+beta (or staging and beta each).

- Run migrations against the target project before promoting code that depends on them.
- Auth **Site URL** and redirect allow-list must include each environment’s origin (`https://staging.packroute.app`, `https://beta.packroute.app`, `https://packroute.app`).
- Disable public signup on all projects (invite-only).

**Avoid** pointing staging/beta at the production database once real customer data exists.

---

## GitHub

- Protect `main` and `beta`: require PR + CI.
- Protect `staging` optionally (still prefer PRs for history).
- CI runs on pushes/PRs for `main`, `staging`, and `beta`.

---

## Developer cheat sheet

```bash
# Start from latest staging
git checkout staging && git pull
git checkout -b feature/my-change

# Open PR into staging (not main)
gh pr create --base staging

# After staging is good, promote
gh pr create --base beta --head staging --title "Promote staging → beta"

# After beta sign-off, release
gh pr create --base main --head beta --title "Release beta → production"
```
