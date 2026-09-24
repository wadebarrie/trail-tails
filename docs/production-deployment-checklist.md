# PackRoute Production Deployment Checklist

Use this checklist before a public launch.

---

## Completed in code

- [x] Cron route publicly accessible with Bearer `CRON_SECRET` only
- [x] Middleware fails closed when Supabase env is missing
- [x] `TWILIO_SMS_REDIRECT_TO` ignored in production unless `TWILIO_ALLOW_SMS_REDIRECT=true`
- [x] Server-side admin MFA enforcement on actions and API routes
- [x] Driver stop optimistic locking before SMS side effects
- [x] Night-before dedup uses company-local day boundaries
- [x] Trial expiry blocks application access
- [x] Missing subscription row blocks access (non–platform-owner)
- [x] Stripe `invoice.paid` restores active status; generic webhook errors
- [x] Stripe webhook event idempotency (`stripe_webhook_events`)
- [x] Health endpoint returns minimal public response
- [x] Auth callback `next` param role-scoped
- [x] Error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`)
- [x] Driver en-route toast no longer claims SMS already sent
- [x] Owner dashboard toggle for new company signups (`platform_settings.invites_enabled`)
- [x] Production env missing-var warnings via `getServerEnv()`
- [x] Explicit tenant FK checks on dog create/update
- [x] Admin customers/dogs pages surface query failures
- [x] ESLint clean; CI enforces `npm run lint`
- [x] GitHub Actions CI (typecheck, lint, helper tests, build)

---

## Environment configuration (Netlify / hosting)

- [ ] `NEXT_PUBLIC_APP_URL=https://packroute.app`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and anon/publishable key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] `CRON_SECRET` (strong random; Netlify scheduled function uses Bearer)
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] `TWILIO_WEBHOOK_URL=https://packroute.app/api/webhooks/twilio`
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (if billing enabled)
- [ ] `GOOGLE_MAPS_API_KEY` (for ETA geocoding)
- [ ] Confirm `TWILIO_SMS_REDIRECT_TO` is **unset** in production (or keep with `TWILIO_ALLOW_SMS_REDIRECT=true` only while piloting Twilio trial)
- [ ] Confirm `NODE_ENV=production` on deploy

---

## Provider dashboard setup

### Supabase
- [ ] **Disable public sign-up** in Auth settings (defense in depth — separate from Owner → Settings)
- [ ] Confirm RLS enabled on all tenant tables
- [ ] Run migrations via `supabase db push` (not raw psql loop on prod)
- [ ] Verify no test platform-owner email exists in production

### Twilio
- [ ] Production phone number provisioned
- [ ] Inbound webhook URL points to production `/api/webhooks/twilio`
- [ ] Test inbound SMS (skip request) and outbound (en route)

### Stripe
- [ ] Live mode keys in production env (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Products/Prices for one / two / three+ hikers ($99 / $179 / $299 monthly)
- [ ] Env Price IDs: `STRIPE_PRICE_ONE_HIKER`, `STRIPE_PRICE_TWO_HIKERS`, `STRIPE_PRICE_THREE_PLUS`
- [ ] Optional yearly Price IDs (`STRIPE_PRICE_*_YEARLY`) if offering annual ($990 / $1790 / $2990)
- [ ] Webhook endpoint: `https://packroute.app/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- [ ] Checkout sessions include `metadata.company_id` (app sets this automatically)
- [ ] Customer Portal enabled in Stripe Dashboard (Settings → Billing → Customer portal)
- [ ] Step-by-step: [docs/stripe-live-setup.md](./stripe-live-setup.md)
### Google Cloud
- [ ] Maps Geocoding API enabled; key restricted to server IPs/domains

---

## Manual launch verification

### Public
- [ ] Homepage, SEO pages, contact form, legal pages load
- [ ] `/opengraph-image` returns PNG without login redirect
- [ ] `/llms.txt` accessible

### Auth
- [ ] Admin login → email OTP → dashboard
- [ ] Driver login → `/today`
- [ ] Password reset flow
- [ ] Invite-only signup (no public registration)

### Operations
- [ ] Create customer, dog, route, schedule
- [ ] Sync today's hikes; assign driver
- [ ] Driver: En Route → customer SMS (check notification log)
- [ ] Night-before cron (trigger manually or wait for hourly schedule)
- [ ] Pending request approve/decline SMS

### Security
- [ ] Cross-tenant: user A cannot access company B data via URL manipulation
- [ ] Admin API routes return 403 without MFA session
- [ ] `/api/cron/night-before` returns 401 without Bearer secret

### Billing
- [ ] Trial company can access app
- [ ] Expired trial redirects to `/subscription-inactive`
- [ ] Admin can start Stripe Checkout from `/subscription-inactive` or Settings → Billing
- [ ] Successful Checkout restores dashboard access (`status: active`)
- [ ] Stripe test payment failure → `past_due` → payment success → `active`
- [ ] Billing portal opens for an active Stripe customer

---

## Intentionally deferred

- Inbound SMS normalized phone index
- Outbound notification UNIQUE index / retry queue
- Full admin page query-error rollout (beyond customers/dogs)
- Rate limiting on auth/webhooks
- E2E test suite

---

## Rollback

- Revert merge commit on `main`
- Netlify auto-deploys previous build
- Avoid destructive migrations without a restore plan
