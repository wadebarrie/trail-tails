# PackRoute Production Readiness Audit

**Branch:** `feature/production-readiness`  
**Date:** July 2026  
**Scope:** Full application review — security, reliability, UX, billing, deployment

---

## Executive summary

PackRoute has a strong product foundation: thoughtful driver workflow (optimistic UI, GPS auto-arrival, wake lock), comprehensive RLS tenant isolation, Twilio/Stripe webhook signature validation, and polished marketing surfaces. The codebase is type-safe and builds cleanly.

The primary gaps before a responsible public launch are **operational reliability** (cron blocked by auth, notification deduplication), **server-side security enforcement** (MFA UI-only, middleware fail-open on misconfiguration), and **production UX resilience** (no error boundaries, silent admin query failures).

This audit categorizes findings and tracks remediation on the feature branch.

---

## Critical

| ID | Area | Current behavior | Risk | Fix | Status |
|----|------|------------------|------|-----|--------|
| C1 | Cron | `/api/cron/night-before` not in public paths; Netlify scheduled function gets login redirect | Night-before SMS never runs in production | Add `/api/cron` to public prefixes; Bearer-only auth | **Fixed** |
| C2 | Auth config | Supabase `handle_new_user` trusts `user_metadata` for role/company | Horizontal privilege escalation if public signup enabled | Verify signup disabled in Supabase dashboard; document in deploy checklist | **Deferred (ops)** |

---

## High

| ID | Area | Current behavior | Risk | Fix | Status |
|----|------|------------------|------|-----|--------|
| H1 | MFA | Admin MFA enforced only in client `AdminMfaGate` | Server actions/API reachable at AAL1 after password login | `requireAdminMfa()` on admin server actions and API routes | **Fixed** |
| H2 | SMS redirect | `TWILIO_SMS_REDIRECT_TO` works in production | All customer SMS misrouted in prod if left set | Block redirect when `NODE_ENV=production` | **Fixed** |
| H3 | Middleware | Missing Supabase env → middleware passes all traffic | Unauthenticated access if env misconfigured | Return 503 when auth env missing | **Fixed** |
| H4 | Driver SMS | Stop status update doesn't verify row count; side effects always fire | Duplicate en-route/pickup SMS on race | Optimistic lock with `.select("id")`; notify only on successful transition | **Fixed** |
| H5 | Cron secret | Secret in query string | Leaks via access logs | Bearer header only in Netlify function | **Fixed** |
| H6 | Trial access | `canAccessApplication` ignores `trial_ends_at` | Expired trials retain access | Check `trialHasExpired()` | **Fixed** |
| H7 | Error UI | No `error.tsx`, `global-error.tsx`, or `not-found.tsx` | White screen on uncaught errors | Add segment error boundaries | **Fixed** |
| H8 | Health API | Returns company count and DB error messages publicly | Information disclosure | Public response is `{ status: "ok" }` only | **Fixed** |
| H9 | Stripe webhook | Returns 422 with internal error details; no `invoice.paid` handler | Stripe retries + missed payment recovery | Generic errors to Stripe; handle `invoice.paid` | **Fixed** |
| H10 | Night-before dedup | `created_at >= todayT00:00:00Z` uses UTC not company TZ | Duplicate or skipped reminders | Filter by company-local day UTC bounds | **Fixed** |
| H11 | Driver toast | “Family has been notified” before SMS sends | Misleading driver feedback | “En route — customer will be notified” | **Fixed** |
| H12 | Auth callback | `next` param allows any `/path` without role check | Open redirect to privileged routes before middleware | Reuse `getLoginRedirect()` after session | **Fixed** |

---

## Medium

| ID | Area | Current behavior | Risk | Fix | Status |
|----|------|------------------|------|-----|--------|
| M1 | Env validation | Only client Supabase vars validated at startup | Late failures in webhooks/SMS | Extend `getServerEnv()` with production warnings | **Partial** |
| M2 | Admin pages | Supabase `error` ignored; empty lists on DB failure | Silent operational blindness | `QueryErrorBanner` component + dashboard adoption | **Partial** |
| M3 | Subscription | Missing subscription row allows access | Free access for misprovisioned companies | Deny when subscription null (non-owner) | **Fixed** |
| M4 | Cross-FK validation | `createDogAction` doesn't verify customer tenant | RLS blocks but poor DX | Explicit company_id checks on parent FKs | **Deferred** |
| M5 | Stripe idempotency | No `stripe_event_id` persistence | Duplicate webhook processing | Add events table | **Deferred** |
| M6 | Inbound SMS | Full customer scan for fuzzy phone match | Scale + memory risk | Normalize phones at write; indexed lookup | **Deferred** |
| M7 | Failed SMS retry | Failed outbound logged, not retried | Customers miss updates | Retry queue | **Deferred** |
| M8 | ESLint | `npm run lint` crashes (FlatCompat circular JSON) | CI cannot lint | Fix eslint flat config | **Deferred** |
| M9 | Tests | No Jest/Vitest; script-based tests only | Regression risk | Extend script tests for new helpers | **Partial** |
| M10 | CI/CD | No GitHub Actions workflow | No automated validation on PR | Add CI workflow | **Deferred** |

---

## Low

| ID | Area | Finding | Status |
|----|------|---------|--------|
| L1 | Cron compare | Secret uses `!==` not timing-safe | **Fixed** |
| L2 | Driver empty state | Generic “no stops” message | **Deferred** |
| L3 | Skip link | No skip-to-main | **Deferred** |
| L4 | Admin tables | Missing `scope="col"` on headers | **Deferred** |
| L5 | Migration docs | `supabase/README.md` lists 3 of 29 migrations | **Deferred** |

---

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | Pass |
| Build | `npm run build` | Pass |
| Lint | `npm run lint` | Pre-existing failure (ESLint FlatCompat) |
| Subscription helpers | `npm run test:subscription` | Pass (updated) |
| Safe redirect | `npm run test:safe-redirect` | Pass (added) |

---

## Intentionally deferred

- Full admin query-error handling on every page (pattern added; rollout incremental)
- Stripe event idempotency table migration
- Outbound notification UNIQUE index migration
- Rate limiting on auth/webhooks
- E2E test framework
- Visual redesign / new features

See `docs/production-deployment-checklist.md` for launch verification steps.
