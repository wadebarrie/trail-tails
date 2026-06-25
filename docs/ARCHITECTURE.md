# Trail Tails — Product Architecture (Phase 1)

> **Status:** Phase 1 complete. No code has been written yet.
> **Last updated:** 2025-06-25

---

## 1. Problem Statement

Dog hiking companies lose hours each week to repetitive status calls and texts. Trail Tails replaces those interactions with automated SMS updates and a dead-simple driver interface — while keeping humans in the loop for schedule changes.

**MVP success criteria:**
- Office can manage customers, dogs, and schedules in one place
- Drivers complete pickup/dropoff with ≤2 taps per action on mobile
- Customers get timely ETAs and status texts without creating accounts
- Schedule-change requests via SMS require admin approval before taking effect

---

## 2. Architectural Principles

| Principle | How we apply it |
|-----------|-----------------|
| Boringly maintainable | Feature-based folders, no premature abstractions |
| Single deploy unit | One Next.js app on Netlify (admin + driver + API) |
| Supabase as backend | Postgres + Auth + RLS; skip Prisma unless we hit a wall |
| Humans approve changes | Inbound SMS creates pending requests, never auto-modifies schedules |
| Fail gracefully | Missing GPS, Maps, or Twilio errors never block driver workflow |
| Design for extension | `company_id` on all tenant tables from day one (single company in MVP) |

---

## 3. System Context

```
┌─────────────┐     SMS      ┌──────────────┐
│  Customers  │◄────────────►│    Twilio    │
│  (no login) │              └──────┬───────┘
└─────────────┘                     │ webhook + send
                                    ▼
┌─────────────┐   HTTPS    ┌────────────────────────────┐
│   Drivers   │◄──────────►│  Next.js on Netlify        │
│  (mobile)   │            │  • Admin dashboard         │
└─────────────┘            │  • Driver UI               │
                           │  • API routes              │
┌─────────────┐   HTTPS    │  • Scheduled jobs          │
│   Admins    │◄──────────►└───────────┬────────────────┘
└─────────────┘                        │
                                       ▼
                           ┌────────────────────────────┐
                           │  Supabase                  │
                           │  • PostgreSQL + RLS        │
                           │  • Auth (admin + driver)   │
                           └────────────────────────────┘
                                       │
                           ┌───────────▼────────────────┐
                           │  Google Maps Platform      │
                           │  (Distance Matrix / Routes)│
                           └────────────────────────────┘
```

---

## 4. Key Design Decisions

### 4.1 No Prisma — use Supabase directly

| Option | Pros | Cons |
|--------|------|------|
| **Supabase JS client + SQL migrations** ✓ | RLS works natively; one source of truth; fewer layers | Less ORM ergonomics |
| Prisma + Supabase | Familiar ORM | RLS bypass issues; two schema definitions; extra complexity |

**Decision:** Supabase SQL migrations + typed client. RLS is central to our security model; an ORM adds a layer that fights it.

### 4.2 Next.js Route Handlers over separate Netlify Functions

| Option | Pros | Cons |
|--------|------|------|
| **App Router `app/api/*`** ✓ | Shared types/utils; single codebase; works on Netlify | Coupled to Next deploy |
| Standalone Netlify Functions | Independent scaling | Duplicate config; harder to share code |

**Decision:** Route Handlers for all API endpoints. Netlify scheduled functions only for cron-style jobs (night-before reminders).

### 4.3 Google Distance Matrix over Routes API

For MVP we need **one origin → one destination ETA**, not turn-by-turn routing.

| API | Fit |
|-----|-----|
| **Distance Matrix API** ✓ | Purpose-built for travel time between points; simple request/response |
| Routes API | Better for multi-stop optimization (explicitly out of scope) |

**Decision:** Distance Matrix API. Revisit Routes API only if we add live map / route history later.

### 4.4 Admin-defined route order (no route optimization)

The office sets stop order via drag-and-drop. Drivers follow that list — no GPS-based reordering.

- **Default order:** `dogs.route_sort_order` — admin drag-and-drop on route settings or dogs list
- **Per-day override:** `stops.sort_order` — admin can reorder today/tomorrow without changing defaults
- **Driver UI:** Stops listed `ORDER BY sort_order`; driver works top-to-bottom
- Pickup and dropoff for the same dog share the same position

No turn-by-turn route optimization in MVP — only point-to-point ETA to the next stop.

### 4.5 Pickup and dropoff as separate stop types

Each scheduled dog-day generates up to two **stops**:

| Stop type | When shown | Driver actions |
|-----------|------------|----------------|
| `pickup` | Morning session | En Route → Picked Up |
| `dropoff` | Afternoon session | En Route → Dropped Off |

This maps directly to the driver UI ("Morning pickups" / "Afternoon drop-offs") and keeps notification triggers obvious.

### 4.6 Hike = one operational day

A **hike** is the container for a driver's work on a given calendar date:

```
Hike (2025-06-25, driver_id)
  ├── Stop: Rawley pickup   → en_route → picked_up
  ├── Stop: Mariner pickup  → en_route → picked_up
  ├── Stop: Rawley dropoff  → en_route → dropped_off
  └── Stop: Mariner dropoff → en_route → dropped_off
```

Hikes are auto-created (via nightly job or first driver login) from recurring schedules minus exceptions.

### 4.7 SMS commands → pending requests (never auto-apply)

Inbound SMS flow:

```
Customer texts "SKIP TOMORROW"
  → Twilio webhook
  → Validate signature
  → Parse command
  → Match phone → customer → dog(s)
  → INSERT pending_request (status: pending)
  → Reply: "Got it! We'll review your request shortly."
  
Admin approves
  → INSERT schedule_exception
  → UPDATE pending_request (status: approved)
  → Send confirmation SMS
  → Regenerate affected stops if needed
```

This prevents accidental schedule corruption from typos or wrong numbers.

### 4.8 Cron / scheduled notifications

| Notification | Trigger | Implementation |
|--------------|---------|----------------|
| Night-before reminder | Daily ~6 PM local | Netlify scheduled function |
| Morning "on the way" | Driver taps En Route | Event-driven (driver action) |
| Dropoff confirmation | Driver taps Dropped Off | Event-driven (driver action) |

All outbound messages go through a single `NotificationService` that logs to `notification_log` and `sms_messages`.

---

## 5. User Roles & Authorization

```
┌──────────────────────────────────────────────┐
│  Supabase Auth (email + password)            │
│  app_metadata.role = 'admin' | 'driver'      │
└──────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
   Admin routes                 Driver routes
   (admin)/dashboard/*          (driver)/today/*
   Full CRUD                    Read own hike/stops
   Approve requests             Update stop status
   View all SMS/logs            Send GPS for ETA
```

**RLS policy summary:**
- Admins: full access within their `company_id`
- Drivers: read/update stops on hikes assigned to them for today ± tomorrow
- No public/customer API access (customers interact via SMS only)
- Service role used only in server-side API routes and webhooks (never exposed to client)

---

## 6. Core Domain Model (Conceptual)

```
Company
  └── Users (admin | driver)
  └── Customers
        └── Dogs
              └── RecurringSchedule (days of week)
              └── ScheduleExceptions (skip, vacation, pause)
  └── Hikes (date + driver)
        └── Stops (dog + type + status)
  └── PendingRequests (from inbound SMS)
  └── SmsMessages (inbound + outbound)
  └── NotificationLog (all automated notifications)
  └── AuditLog (admin actions)
```

**Relationships (detailed in Phase 2):**
- Customer 1→N Dogs
- Dog 1→N RecurringScheduleDays (e.g., Mon, Tue, Thu)
- Dog 1→N ScheduleExceptions
- Hike 1→N Stops
- Stop N→1 Dog
- PendingRequest N→1 Customer, optionally N→1 Dog
- SmsMessage N→1 Customer (nullable for system messages)

---

## 7. Feature-Based Code Structure (Planned)

```
src/
├── app/
│   ├── (admin)/          # Admin layout + dashboard pages
│   ├── (driver)/         # Driver mobile layout
│   └── api/              # Route handlers (REST + webhooks)
├── features/
│   ├── auth/
│   ├── customers/
│   ├── dogs/
│   ├── schedules/        # recurring + exceptions
│   ├── hikes/            # daily stop generation
│   ├── driver-actions/   # en route, picked up, dropped off
│   ├── sms/              # parser, webhook, outbound send
│   ├── notifications/    # reminder cron, logging
│   ├── pending-requests/ # approval workflow
│   └── audit/
├── lib/
│   ├── supabase/         # client factories (browser, server, service)
│   ├── twilio/
│   ├── google-maps/      # ETA service
│   └── validation/       # Zod schemas
└── types/
```

Each feature owns its queries, actions, and components. Shared utilities stay in `lib/`. No "services layer" abstraction until a second consumer appears.

---

## 8. API Surface (Overview — full spec in Phase 3+)

| Area | Key endpoints |
|------|---------------|
| Auth | Supabase Auth (login/logout); middleware role checks |
| Customers | CRUD + search |
| Dogs | CRUD + link to customer |
| Schedules | Set recurring days; manage exceptions |
| Hikes | GET today/tomorrow; auto-generate |
| Driver | PATCH stop status; POST en-route (with GPS) |
| SMS | POST `/api/webhooks/twilio` (inbound) |
| ETA | Internal service called by driver action (not public) |
| Pending requests | List, approve, decline |
| History | SMS + notification logs |

All endpoints documented with request/response schemas during implementation phases.

---

## 9. Security Plan

| Threat | Mitigation |
|--------|------------|
| Unauthorized dashboard access | Supabase Auth + middleware role guard |
| Cross-tenant data leak | RLS on all tables filtered by `company_id` |
| Twilio webhook spoofing | Validate `X-Twilio-Signature` on every request |
| SQL injection | Parameterized queries via Supabase client |
| XSS | React auto-escaping; sanitize any rich text (notes fields) |
| Rate limiting | Netlify edge rate limits + application-level limits on webhooks |
| Secret exposure | All keys in Netlify env vars; service role server-only |
| Audit trail | `audit_log` table for approve/decline, schedule changes, driver overrides |

---

## 10. Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| No GPS permission | Allow En Route; SMS says "We're on the way" without ETA |
| Google Maps failure | Same fallback; log error; retry not needed |
| Twilio send failure | Log error; show admin alert; driver action still succeeds |
| Invalid SMS command | Reply with HELP text; no pending request created |
| Duplicate inbound SMS | Idempotency key on `(from_number, body, minute_bucket)` |
| Driver offline | Actions queue locally (future); MVP: show error toast, retry button |
| Approval conflict | Optimistic lock on pending_request; second approver gets 409 |
| Stop already completed | Idempotent PATCH — return current state, no duplicate SMS |

**Principle:** Driver workflow never blocks on external service failure. Notifications are best-effort side effects.

---

## 11. SMS Command Parser (Design)

Standalone module: `features/sms/parser.ts`

```
Commands (case-insensitive, trimmed):
  SKIP TOMORROW          → skip next scheduled date for matched dog(s)
  SKIP MONDAY            → skip next occurrence of that weekday
  SKIP JULY 12           → skip specific date
  VACATION JULY 10-18    → date range exception
  PAUSE | PAUSE FOR NOW  → open-ended pause
  RESUME | BACK ON       → end active pause
  HELP                   → return command list (no pending request)
```

Parser returns a typed result:

```typescript
type ParseResult =
  | { type: 'skip_date'; date: Date }
  | { type: 'skip_weekday'; weekday: number }
  | { type: 'vacation'; start: Date; end: Date }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'help' }
  | { type: 'unknown'; raw: string }
```

Phone number → customer lookup uses normalized E.164 format stored at signup.

---

## 12. ETA Service (Design)

Standalone module: `lib/google-maps/eta.ts`

```
Input:  { origin: { lat, lng }, destination: { lat, lng } }
Output: { durationMinutes: number, distanceMeters: number } | null

Flow:
  1. Driver taps "En Route" → browser geolocation
  2. POST /api/driver/stops/[id]/en-route { lat, lng }
  3. Server loads stop → dog → customer address (geocoded)
  4. ETA service calls Distance Matrix
  5. NotificationService sends SMS with ETA
  6. Log to notification_log + sms_messages
```

Customer addresses geocoded once on save (store lat/lng) to avoid geocoding on every ETA request.

---

## 13. Future Extensibility (Design Only)

| Future feature | Extension point |
|----------------|-----------------|
| Live map | `stops` already has lat/lng timestamps; add `location_updates` table |
| Auto arrival detection | Geofence check in driver action handler |
| Push notifications | Add `device_tokens` table; keep NotificationService as sender |
| Photo after hike | Supabase Storage + `hike_photos` table linked to hike |
| Walk report cards | `hike_reports` table linked to hike |
| GPS route history | `location_updates` time-series table |
| Online payments | Stripe webhook + `invoices` table |
| Customer portal | Add auth provider for customers; reuse existing read APIs |
| Multi-location | `company_id` already on all tables; add location sub-entity |
| Route optimization | `sort_order` already on stops; plug in Routes API for auto-ordering |

None of these require MVP schema rewrites.

---

## 14. Deployment Architecture

```
GitHub repo
  → Netlify (auto-deploy on push to main)
      ├── Next.js SSR/SSG
      ├── Environment variables (Supabase, Twilio, Google Maps)
      └── Scheduled functions (night-before SMS cron)

Supabase project (hosted)
  ├── PostgreSQL
  ├── Auth
  └── SQL migrations via Supabase CLI
```

**Environments:** `development` (local + Supabase branch optional), `production`. No staging required for MVP but Netlify preview deploys give PR-level testing.

---

## 15. Phase Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Product architecture (this document) | ✅ Complete |
| 2 | Database design + ERD ([DATABASE.md](./DATABASE.md)) | ✅ Complete |
| 3 | Supabase SQL migrations | ✅ Complete |
| 4 | Next.js scaffold | ✅ Complete |
| 5 | Authentication | ✅ Complete |
| 6 | Admin dashboard | ✅ Complete |
| 7 | Driver interface | ✅ Complete |
| 8 | Twilio integration | **Next** |
| 9 | Google Maps ETA | Pending |
| 10 | SMS parser | Pending |
| 11 | Approval workflow | Pending |
| 12 | Testing | Pending |

---

## 16. Product Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Single company MVP? | Yes — one company row; `company_id` on all tables for future multi-tenant |
| Pickup time windows | **Per dog** — stored on `dogs.pickup_window_start/end` |
| SMS skip scope | **Customer-level** — SKIP commands apply to all active dogs for that customer |
| Driver assignment | One vehicle / one hike per day with one assigned driver; co-walkers share the device |
| Timezone | One per company on `companies.timezone`; default `America/Los_Angeles` |

Full schema: [DATABASE.md](./DATABASE.md)
