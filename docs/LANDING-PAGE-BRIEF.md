# PackRoute — Landing Page Brief

Handoff doc for a designer/dev building a simple, fun SaaS-style marketing page.

---

## Product summary

**PackRoute** is an operations platform for **dog hiking / group dog walk companies** (pickup → trail hike → drop-off, multiple dogs per route, multiple drivers, recurring weekday schedules).

**One-liner:** Dog hike operations, simplified.

**Elevator pitch:** Dog hiking companies lose hours every week to “where’s the driver?” calls and schedule-change texts. PackRoute replaces that with automated SMS updates, a dead-simple driver mobile app, and an office dashboard — while keeping humans in the loop for schedule changes.

| Resource | URL |
|----------|-----|
| Live app | https://packroute.netlify.app |
| Login | https://packroute.netlify.app/login |
| Repo | https://github.com/wadebarrie/trail-tails |

---

## Target audience

**Primary buyer:** Owner or office manager of a small–mid dog hiking / adventure walk business (1–10 drivers, dozens to hundreds of dogs).

**Secondary users (not landing page signups, but worth showing on the page):**

- **Drivers** — mobile-first, need ≤2 taps per action
- **Customers (dog owners)** — no app, no login; everything via SMS

**Not for:** Individual dog walkers doing 1:1 walks, giant franchise ops, or pet-sitting-only businesses (unless they also do group hikes).

---

## Core problem → solution

| Pain | PackRoute answer |
|------|------------------|
| Constant “when will you arrive?” texts | Driver taps **En Route** → customer gets ETA SMS |
| Manual schedule juggling (skips, vacations) | Customers text natural-language commands; office **approves** before anything changes |
| Spreadsheets + group texts for routes | One dashboard: customers, dogs, routes, today/tomorrow |
| Drivers confused about order / status | Mobile **Today** view with pickups, drop-offs, progress |
| No paper trail | SMS history, notification log, audit trail |

**Key differentiator:** Customers never need an account. The office stays in control. SMS schedule changes are **requests**, not auto-applied.

---

## Feature set (what’s real today)

### Office (Admin dashboard)

- **Dashboard** — today’s ops overview
- **Today / Tomorrow** — assign drivers, view/reorder stops, mark hikes complete
- **Routes** — weekday schedules, dog order (drag-and-drop), default driver
- **Customers** — owners, addresses, phones (primary + secondary contact)
- **Dogs** — breed, notes, pickup windows, per-dog rates, schedule days
- **Drivers** — profiles, route assignments
- **Pending requests** — approve/decline inbound SMS schedule changes
- **Exceptions** — skips, vacations, pauses (add/edit/delete)
- **Billing** — completed hikes by date range, CSV export
- **Settings** — company timezone, default rates
- **SMS & notification history** — full log of what went out
- **Help & guide** — in-app docs for staff and drivers

### Drivers (mobile web app)

- **Today / Tomorrow** views (Tomorrow is preview-only)
- **En Route → Arrived → Picked up / Dropped off** workflow
- **GPS / location** — auto-arrival detection (~150 m), manual fallback
- **Google Maps ETA** — sent to customer when driver taps En Route
- **Pickup reorder** — drag to adjust order on the fly (when enabled)
- **Customer info sheet** — address, notes, contact at each stop

### Customers (SMS only — no app)

**Automated texts:**

1. **Night-before reminder** (~6 PM local) — pickup window for tomorrow
2. **En route** — “We’re on the way…” with ETA
3. **Arrived** — optional arrival text
4. **Picked up / Dropped off** — confirmation

**Inbound SMS (natural language):**

- Skip tomorrow / skip a weekday / skip a date / skip next week
- Vacation ranges, pause, resume
- **HELP** — menu of options

Every change creates a **pending request**; office approves or declines. Reply: *“Got it! We’ll review your request shortly.”*

**Sample customer explainer (use on landing page or FAQ):**

> PackRoute texts you the night before a hike (around 6 PM) with your pickup window. When the driver is on the way, you'll get an ETA text. You can reply to change your schedule — text HELP for options. The office reviews every change before it takes effect, so you're never accidentally skipped.

**Example SMS thread for mocks:**

- *“Hi Sam! Cooper and Daisy are booked for a hike tomorrow and will be picked up between 8:05 AM and 8:35 AM.”*
- *“Hi Sam! We’re on the way to pick up Cooper. ETA is approximately 12 minutes.”*
- Customer: *“Skip Friday”*
- *“Got it! We’ll review your request shortly.”*

---

## Suggested landing page structure

Keep it **simple and fun SaaS** — not enterprise. Think: Linear, Notion, or Cal.com energy, but outdoorsy.

### 1. Hero

**Headline options:**

- “Dog hike operations, simplified.”
- “Run your pack. Not your phone.”
- “Less texting. More trail time.”

**Subhead:** Manage schedules, keep customers updated, and give drivers a dead-simple mobile workflow.

**CTAs:**

- Primary: **“Book a demo”** or **“Get early access”** (no self-serve signup yet)
- Secondary: **“See how it works”** (scroll)
- Optional tertiary: **Office login** / **Driver login** → `/login`

### 2. Social proof strip (placeholder)

- “Built for dog hiking companies in BC” (pilot context — adjust as needed)
- Logos or quotes TBD

### 3. Three-column “How it works”

| Office | Driver | Customer |
|--------|--------|----------|
| Set routes, dogs, schedules | Open Today on phone | Gets texts — no app |
| Approve SMS requests | Tap En Route, Picked up | Texts SKIP TOMORROW, HELP |
| Reorder stops, close out hikes | GPS + auto-arrival | Office confirms every change |

### 4. Feature highlights (4–6 cards)

1. **Automated SMS updates** — Night-before reminders, ETAs, pickup/drop-off confirmations.
2. **Driver app that drivers actually use** — Big buttons, mobile-first, works in the browser.
3. **Schedule changes via text** — Customers text in plain English; you approve with one click.
4. **Routes & stops, your way** — Drag-and-drop order; today/tomorrow overrides without breaking defaults.
5. **Billing built in** — Track completed hikes and export CSV.
6. **Human in the loop** — Nothing changes on the route until you say so.

### 5. SMS moment (visual / mock)

Phone mock with the example thread above.

### 6. Driver UI teaser

Screenshot or stylized mock of dark green driver header (“PackRoute · Driver”), location pill, stop list with En Route buttons.

### 7. Admin dashboard teaser

Screenshot or mock of light admin UI — Today view, route list, pending requests badge.

### 8. FAQ (5–7 items)

- **Do customers need to download an app?** No — SMS only.
- **Can schedule changes happen automatically?** No — admin approval required.
- **Does it optimize routes with AI?** No — you set the order; drivers follow it.
- **What if GPS fails?** Drivers can mark arrived manually; hikes still complete.
- **Works on iPhone/Android?** Yes — driver app is mobile web (add to home screen).
- **Pricing?** TBD — use “Contact us” for now.

### 9. Footer CTA

- Email waitlist / contact form
- Links: Login, Privacy (TBD), Terms (TBD)

---

## Brand & visual direction

### Name

**PackRoute** — always one word, capital P and R.

### Tagline (in app today)

*Dog hike operations, simplified*

### Color palette

| Token | Hex | Use |
|-------|-----|-----|
| Trail 50 | `#f0f7f4` | Light backgrounds, subtle sections |
| Trail 100 | `#dceee6` | Cards, highlights |
| Trail 600 | `#2d6a4f` | Primary green, CTAs, links |
| Trail 700 | `#1b4332` | Hover, headings accent |
| Trail 800 | `#081c15` | Driver UI background, dark sections |
| Stone 50+ | Tailwind defaults | Admin page background, body text |

**CTA green:** `#2d6a4f` (hover `#245a42`, active `#1b4332`)

**Theme color (mobile browser chrome):** `#1b4332`

### Typography (in app)

- **Geist Sans** — body/UI
- **Geist Mono** — optional for SMS/code examples

Landing page can use Geist for consistency or something with slightly more personality (still clean sans).

### Visual mood

- Outdoorsy but **professional SaaS**, not cartoonish
- Forest green + warm stone neutrals
- Friendly, trustworthy, operational — “we handle the boring stuff so you can be on the trail”
- Dog/hike photography welcome; avoid generic “pet SaaS” puppy stock if possible — prefer groups on trails, vans, happy chaos

### Existing assets

- App icon: `src/app/icon.png`
- Apple touch icon: `src/app/apple-icon.png`
- No logo wordmark file yet — designer may create “PackRoute” logotype from typography

### UI patterns to echo (for consistency if landing links into app)

- Rounded-xl cards and buttons
- Green primary buttons, white secondary with stone border
- Admin = light (`stone-50` bg); Driver = dark (`trail-800` bg)

---

## Tone & voice

- **Clear, warm, confident** — not jargon-heavy
- Speak to **operators** (office managers), not engineers
- Emphasize **time saved** and **customer peace of mind**
- Avoid overpromising AI, route optimization, or customer portals
- Light humor OK (“your pack” / “trail time”) — keep it professional

---

## CTAs & conversion

**There is no public signup flow today.** The app uses email/password login for admin and driver roles only.

Recommended landing CTAs:

1. **Waitlist / contact form** (email + company name)
2. **Book a demo** (Calendly link — TBD)
3. **Login** → https://packroute.netlify.app/login
   - Optional: `?role=admin` or `?role=driver`

Do **not** promise “Start free trial” unless self-serve onboarding is built first.

---

## Technical notes for dev

### Stack

- Next.js 16, React 19, Tailwind CSS 4
- Hosted on Netlify: https://packroute.netlify.app
- Current homepage is minimal (`src/app/page.tsx`) — two login buttons only

### Integration options

1. **Replace `src/app/page.tsx`** with full marketing page (same repo, simplest)
2. **Separate marketing site** (Webflow, Framer) linking to app subdomain
3. **Subpath** — e.g. root = marketing, `/login` = app (current pattern)

### Links to wire up

| Link | URL |
|------|-----|
| App home | `/` |
| Login | `/login` |
| Office login | `/login?role=admin` |
| Driver login | `/login?role=driver` |

### SEO metadata

**Current:**

- Title: PackRoute
- Description: Operations platform for dog hiking companies

**Suggested for landing:**

- Title: PackRoute — Dog hike operations, simplified
- Description: Schedules, SMS updates, and a simple driver app for dog hiking companies. Keep customers informed without the text thread chaos.

### Screenshots to capture from product

1. Dashboard
2. Today hikes view with stops
3. Pending requests with approve/decline
4. Driver Today view on mobile (375px width)
5. SMS history or notification log (redact phone numbers)

Test logins are in `docs/TEST-LOGINS.md` — do **not** publish credentials on the public landing page.

---

## Sample copy blocks

**Hero subhead:**

Manage schedules, keep customers updated, and give drivers a dead-simple mobile workflow.

**SMS feature:**

Your customers get a text the night before with their pickup window. When the driver leaves, they get an ETA. When the dog is home, they get a confirmation. No app required.

**Driver feature:**

Drivers open Today on their phone, tap En Route, and go. Location-aware arrival detection means fewer manual check-ins. If GPS fails, they tap a button — the hike still gets done.

**Office feature:**

Routes, dogs, exceptions, and driver assignments in one place. When a customer texts “skip tomorrow,” it lands in Pending requests — you approve, and the schedule updates.

**Trust line:**

Every schedule change is reviewed by your team before it takes effect. No accidental skips.

---

## Out of scope — don’t claim on landing page

- Customer mobile app or portal
- Automatic route optimization / turn-by-turn navigation
- Auto-approval of SMS schedule changes
- Multi-company self-serve signup (architecture supports multi-tenant; MVP is single-company pilot)
- Native iOS/Android apps (mobile web only)
- Real-time live map for customers

---

## Personas (for illustrations / copy)

**Alex — Office manager**  
Runs 4 routes, 40+ dogs, 6 drivers. Dreads the 7 AM “where are you?” texts. Wants one screen for today.

**Jordan — Driver**  
On the road, gloves half on, needs big buttons. Doesn’t want to learn software.

**Sam — Customer**  
Loves the service, forgets schedule sometimes. Wants to text “skip Friday” and know it worked.

---

## Deliverables checklist

- [ ] Desktop + mobile responsive landing page
- [ ] Hero + 3 persona “how it works”
- [ ] 4–6 feature sections
- [ ] SMS conversation mock
- [ ] Product screenshots or stylized mocks
- [ ] FAQ
- [ ] Footer with login links + contact/waitlist
- [ ] Favicon from existing `src/app/icon.png`
- [ ] Open Graph image (1200×630) — not built yet
- [ ] Match PackRoute green palette
- [ ] Optional: short looping demo video (screen record driver flow)

---

## Open questions (decide before launch)

1. **Primary CTA** — waitlist email, demo booking, or “contact us”?
2. **Pricing** — show “Contact for pricing” or hide entirely?
3. **Company name on landing** — PackRoute only, or “PackRoute by [Trail Tails]”?
4. **Geography** — local BC pilot or national/international?
5. **Legal pages** — need Privacy/Terms placeholders?
