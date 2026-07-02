# PackRoute Design Guidelines

> **Single source of truth for product design, visual language, and UX decisions.**
>
> This document describes **where we are**, **where we are going**, and **how to decide** when building new work. When in doubt, read [VISION.md](./VISION.md) for product intent and this file for design execution.

**Last updated:** June 2026 · **Design direction:** Calm liquid glass · Route-first operations

---

## Brand Philosophy

### Who PackRoute is

PackRoute is route-first operations software for **adventure dog hiking businesses** — companies that pick up dogs, run group trail adventures, and return them home. We serve owners, office staff, and drivers who coordinate vehicles, pickup windows, recurring schedules, and customer communication every day.

We are not generic pet-care software. We are not enterprise field-service software. We are the calm control layer for the daily route.

### Emotions the software should create

| Role | Intended feeling |
|------|------------------|
| **Office** | In control, unhurried, informed |
| **Driver** | Confident, focused, supported — never monitored |
| **Customer** (via SMS) | Reassured, informed, respected |
| **Owner / founder** | Trust, partnership, clarity on value |

The product should feel like **early morning light on a trail** — clear air, grounded confidence, forward motion without noise.

### Core product values

1. **Route-first** — The daily route is the center of gravity; features orbit it or do not ship.
2. **Reduce work, never create it** — Every interaction must save time or reduce interruptions.
3. **Office owns schedules; drivers own execution** — Software assists judgment; it does not replace it.
4. **Confidence through communication** — Customers get proactive, plain updates; the office stops answering “where are you?”
5. **Simplicity over feature count** — The best tool for running the day, not the biggest platform.

### How users should feel while using the software

- **Calm** — No visual shouting, no dashboard clutter, no surprise modals.
- **Oriented** — Always clear what happened, what is happening, and what to do next.
- **Fast** — Especially on driver taps; speed creates confidence.
- **Trusted** — Professional, reliable, outdoors-capable; never gimmicky or juvenile.
- **Invisible when working** — The best session is one where the route ran smoothly and nobody thought about the software.

---

## Design Principles

These principles apply to every screen, component, and copy decision.

| Principle | Meaning |
|-----------|---------|
| **Reduce cognitive load** | One primary question per screen. Progressive disclosure over dense panels. |
| **Everything should have a purpose** | If it does not help run the route, save time, or build trust — remove it. |
| **Calm over clever** | Restrained UI beats novelty. No decoration for its own sake. |
| **Speed creates confidence** | Optimistic UI on driver actions. Never block taps on SMS, logging, or analytics. |
| **Drivers should never wonder what to do next** | Today view → next stop → one obvious action. |
| **Software should disappear** | Success is a day with fewer interruptions, not time spent in the app. |
| **Optimistic technology** | Forward-looking, capable, trustworthy — not retro, not corporate-bloated. |
| **Friendly professionalism** | Warm and human; never playful, never robotic, never verbose. |
| **Typography first** | Hierarchy through type and spacing before color and chrome. |
| **One primary action per screen** | Secondary actions stay visually subordinate. |
| **Accessible by default** | Contrast, touch targets, motion preferences, and semantic structure are non-negotiable. |

---

## Visual Identity

### Typography

**Current:** Inter (UI and marketing), Geist Mono (code, tabular data where needed).

**Type scale** (defined in `src/app/globals.css`):

| Token | Size | Use |
|-------|------|-----|
| H1 | 2.5rem / weight 650 | Marketing hero, major page titles |
| H2 | 1.75rem / weight 650 | Section headers |
| H3 | 1.25rem / weight 600 | Card titles, subsections |
| Body | 1rem / line 1.55 | Paragraphs, descriptions |
| UI | 0.875rem / weight 500 | Labels, nav, buttons, table text |
| Caption | 0.75rem / weight 500 | Meta, timestamps, helper text |

**Direction:**
- Tight negative tracking on headings (`-0.02em` to `-0.04em`); slightly tight on body (`-0.01em`).
- Prefer **semibold (650)** over bold for headings — softer, more Swiss.
- Driver UI: larger tap labels (base/lg) for dog names and primary actions; minimal secondary text.
- Never use more than three type sizes on a single driver screen.

### Spacing

**Current:** Tailwind spacing scale; common patterns:
- Page padding: `px-4 py-6` (admin), `max-w-6xl` content width
- Card padding: `p-5` (admin), `p-4`–`p-6` (forms)
- Section gaps: `gap-4` grids, `mb-8` below page headers
- Driver: generous vertical rhythm (`space-y-3` stop list, `py-5` primary buttons)

**Direction:**
- Favor **airy admin layouts** — whitespace signals control, not emptiness.
- Driver spacing prioritizes **thumb reach** and separation between stops.
- Use consistent vertical rhythm within a role; do not mix tight and loose arbitrarily.

### Grid

| Context | Grid |
|---------|------|
| Admin dashboard | `sm:grid-cols-2 lg:grid-cols-3` stat cards |
| Admin forms | Single column `max-w-lg` / `max-w-xl`; two-column only when fields are logically paired |
| Landing | `max-w-6xl` container; hero `lg:grid-cols-2` |
| Owner analytics | `max-w-7xl`; metric tiles in responsive grids |
| Driver | Single column; full-width actions |

**Direction:** No complex multi-column admin layouts unless data density truly requires it (tables, analytics).

### Corner radius

**Tokens:**
- `--radius-surface` (12px / 0.75rem) — buttons, inputs, nav pills
- `--radius-card` (16px / 1rem) — cards, panels, sheets
- `--radius-pill` — badges, status chips

**Direction:** Slightly rounder than classic SaaS (8px); never fully square, never bubble-gum circular on large surfaces.

### Shadows

**Elevation tokens** (soft, ink-tinted — never harsh black drops):

| Token | Use |
|-------|-----|
| `--elevation-1` | Inputs, subtle cards, header separation |
| `--elevation-2` | Default cards, popovers, hover lift |
| `--elevation-3` | Featured cards, marketing mockups, emphasis |

**Direction:** Shadows suggest **floating paper on a desk**, not Material Design drama. Driver dark UI uses minimal shadow; contrast comes from surface tone.

### Glass usage

**Current utilities** (`globals.css`):

| Class | Opacity / blur | Intended use |
|-------|----------------|--------------|
| `.surface-glass` | ~72% white + 16px blur | Secondary buttons, subtle panels |
| `.surface-glass-strong` | ~90% white + blur | Popovers, pickers, table shells, frosted panels |
| `.surface-glass-dark` | Dark translucent + blur | Driver stop cards, sheets (content areas) |
| `.surface-header` | **Opaque** white | Sticky top nav bars (admin, owner, landing) |
| `.surface-header-dark` | **Opaque** ink | Sticky driver header |

**Rules:**
- ✅ Glass on: popovers, picker panels, driver cards, landing feature cards, auth card wrapper, table shells
- ✅ **Opaque** on: sticky headers (content scrolls underneath — nav must stay readable)
- ❌ Glass on: full-page backgrounds behind dense tables, primary form fields on busy pages (use `--glass-bg-strong` or opaque surface for text-heavy inputs)
- ❌ Glass on: every element — selective depth only

**Direction:** “Liquid glass” means **atmospheric depth**, not transparency everywhere. Think morning light through a window, not a glass OS parody.

### Elevation & depth

Surface hierarchy (light mode):

1. **Page atmosphere** — `bg-atmosphere` gradient (warm sand + sky wash)
2. **Floating card** — `.surface-card` / `.surface-elevated` (opaque white)
3. **Interactive lift** — hover to `--elevation-3`
4. **Overlay** — sheets, modals: elevation + scrim

Driver mode inverts: deep forest/ink gradient page → translucent glass cards → high-contrast action buttons (amber en route, sky arrived, white complete).

### Contrast

- Body text on light surfaces: `--color-ink` (#253238) on `--color-surface` — WCAG AA minimum.
- Muted text: `--color-text-muted` (#6b746f) — captions and secondary only, not primary actions.
- Driver: white / white-80 on dark; action buttons use dark ink text on amber/sky/white fills for outdoor readability.
- Never rely on color alone for status — pair with label, icon, or position (e.g. driver progress steps).

### Iconography

**Current:** Inline SVG (Heroicons-style strokes in driver info button; simple unicode in mobile nav).

**Direction:**
- Stroke icons, 1.5–2px weight, rounded caps
- Forest or ink on light UI; white/white-70 on driver dark UI
- Icons support labels — rarely icon-only except compact driver info (`i` in circle)
- No emoji in product UI (marketing may use sparingly in mockups only)
- Prefer semantic HTML and text over icon-heavy toolbars

### Illustration style

**Current:** Product mockups built in CSS/React (`mockups.tsx`) — no custom illustration library.

**Direction:**
- Lightweight **UI chrome illustrations** (device frames, dashboard previews) over character illustration
- If illustrations are added: flat, soft geometry, forest/sky/sand palette, no cartoon dogs
- Avoid stock “happy people with dogs” photography clichés on landing pages long-term

### Photography style

**Direction (not yet implemented):**
- Real trails, vehicles, leashes-in-hand — authentic operator context
- Natural light, Pacific Northwest / outdoor adventure tone
- Dogs as subjects secondary to **people running the operation**
- Never sterile studio pet portraits

### Animation philosophy

- **Purposeful, not decorative** — motion confirms action or orients attention
- **Fast** — `--duration-fast` (150ms) for hovers/taps; `--duration-normal` (220ms) for enter/exit
- **CSS only** — no animation libraries; respect `prefers-reduced-motion`
- Driver: `active:scale-[0.98]` on primary taps — tactile, instant feedback

### Loading states

**Current:** `animate-pulse` skeletons (dashboard loading), inline “Saving…” on submit buttons, optimistic driver state.

**Direction:**
- Skeleton shapes match final layout (card grid, table rows)
- Never block driver UI on network — optimistic first, reconcile quietly
- Prefer skeleton over spinners for page-level loads; spinners only for inline field validation if needed

### Empty states

**Current:** `EmptyState` component — dashed border card, centered muted message.

**Direction:**
- Plain language (“No pending requests” not “Nothing to see here!”)
- One suggested next action when applicable (link or button)
- Dashed border = placeholder territory; solid border = real content

### Error states

**Direction:**
- Amber/warm for recoverable issues; red for destructive or blocking errors
- Say what happened and what to do next — one sentence each
- Forms: inline field errors below input; page errors in bordered alert panel
- Driver: toast/feedback bar — short, non-blocking (existing `driver-feedback` pattern)

### Success states

**Direction:**
- Green badge or subtle green wash for completed stops (driver)
- No confetti, no celebration modals
- Confirm and move on — “Pickup recorded.” not “Success! 🎉”

### Accessibility standards

- Minimum touch target: **44px (`min-h-11`)** — enforced globally on buttons/inputs in `globals.css`
- Focus rings: forest green, 2px, visible on keyboard nav
- Semantic HTML: headings, landmarks, `aria-current` on nav, dialog roles on sheets
- `prefers-reduced-motion`: disable scale, blur animations, transitions (implemented)
- Color-scheme: light for admin; driver dark shell with high-contrast text
- Tables: horizontal scroll via `TableShell`, not squashed columns

---

## Color System

### Natural inspiration

Colors come from **Pacific Northwest trail mornings**:

| Color | Hex | Inspiration |
|-------|-----|-------------|
| **Forest** | `#1f5a4a` | Douglas fir, moss, grounded action |
| **Sage** | `#a8c3b0` | Soft understory, hover states, calm success |
| **Sky** | `#5f8fa8` | Clear morning sky, information, route clarity |
| **Sand** | `#e9e2d3` | Dry trail, warm neutrals |
| **Ink** | `#253238` | Deep shade, primary text, driver shell |

### Primary

**Forest** (`--color-forest` / `--color-cta`)

- Primary buttons, links, focus rings, checked form controls
- Brand wordmark accent
- **Do not** use for large background fills except intentional hero/CTA bands

### Secondary

**Sage** (`--color-sage`)

- Hover borders on inputs
- Soft success backgrounds
- Supporting brand moments — never competes with primary CTA

### Accent

**Sky** (`--color-sky`, `--color-sky-50`–`800`)

- Informational UI: ETAs, route clarity, “arrived” driver state, progress accents
- Gradient atmosphere washes (mixed with sand/neutral)
- Links on dark driver UI (sky-300)

### Success

**Green scale** (mapped to forest/sage)

- Completed stops, “Done” badges, positive metrics
- Driver: green-500/30 washes on completed cards
- Prefer semantic `Badge tone="green"` over raw Tailwind green

### Warning

**Amber**

- Pending requests, schedule exceptions, GPS unavailable hints
- `Badge tone="amber"` — action may be needed, not panic

### Danger

**Red**

- Destructive actions, errors, request badges (pending count on nav)
- Use sparingly — red fatigue erodes calm

### Neutral palette

Warm stone scale remapped in `@theme`:

| Token | Role |
|-------|------|
| `--color-bg` / stone-50 | Page base (also atmosphere gradient start) |
| `--color-surface-subtle` / stone-100 | Secondary panels, active nav wash |
| `--color-border` / stone-200 | Dividers, input borders |
| `--color-text-muted` / stone-500 | Captions, hints |
| `--color-ink` / stone-900 | Primary text |

**Legacy note:** `--color-trail-*` aliases map to brand tokens. New work should prefer semantic `--color-forest`, `--color-ink`, etc.

### Background hierarchy

| Layer | Class / token | Context |
|-------|---------------|---------|
| App page | `.bg-atmosphere` | Admin, owner |
| Marketing hero | `.bg-atmosphere-hero` | Landing |
| Auth | `.bg-atmosphere-auth` | Login, signup |
| Driver shell | `.bg-atmosphere-driver` | `/today`, `/tomorrow` |
| Section band | `.surface-glass` or `.surface-card` | Landing alternating sections |

### Surface hierarchy

| Level | Utility | When |
|-------|---------|------|
| Flat inset | `bg-stone-100` / subtle fill | Nested table rows, mockup inset panels |
| Card | `.surface-card` | Default content container |
| Elevated | `.surface-elevated` | Interactive cards, dashboard stats, FAQ |
| Glass | `.surface-glass-strong` | Popovers, pickers, frosted shells |
| Header | `.surface-header` | Sticky nav (opaque) |

### Glass surfaces

See [Glass usage](#glass-usage). Prefer opaque surfaces when:
- User reads dense text (legal, billing tables)
- Sticky header/overlap with scrolling content
- Outdoor sunlight (driver primary actions)

### Gradient usage

| Gradient | Use |
|----------|-----|
| `--gradient-page` | Admin/owner page background |
| `--gradient-hero` | Landing hero, legal shell |
| `--gradient-auth` | Auth layout backdrop |
| `--gradient-driver` | Driver app shell |
| Button `from-[#267a66] to-forest` | Primary CTA vertical lift (intentional; migrate to token) |

**Rules:** Low saturation, natural light direction. No neon, no purple-blue SaaS gradients. Radial sky wash on hero only.

---

## Components

> **Source files:** `src/features/admin/components/ui.tsx`, `button-styles.ts`, `form-styles.ts`, `picker-styles.ts`, role-specific components below.

### Buttons

| Variant | Class / component | Use |
|---------|-------------------|-----|
| Primary | `primaryButtonClassName` | Main form submit, destructive-safe confirmations |
| Secondary | `secondaryButtonClassName` | Cancel, filter, low-emphasis actions |
| Landing primary | `landingPrimaryButtonClassName` | Marketing CTAs |
| Driver primary | Large full-width, role-colored | En Route (amber), Arrived (sky), Complete (white) |

**Rules:**
- One primary button per form/view
- `min-h-11`, `motion-interactive`
- Disabled: opacity 50%, no pointer events
- Driver: no small text-only primary actions for route steps

### Cards

| Component | Surface | Use |
|-----------|---------|-----|
| `Card` | `.surface-elevated` | Dashboard stats, settings sections |
| `EmptyState` | `.surface-card` dashed | Zero-data states |
| Admin inline sections | *Migrating* — should use `Card` | Many pages still use raw `rounded-xl border` |

**Direction:** All admin content blocks should converge on `Card` or `surface-*` utilities.

### Forms

| Element | Source |
|---------|--------|
| Text inputs | `form-styles.ts` → `inputClassName` |
| Textareas | `textareaClassName` |
| Selects | `selectClassName` |
| Date/time/month | `DatePickerField`, `TimePickerField`, `MonthPickerField` |
| Checkboxes/radios | Global styles in `globals.css` |

**Direction:** Import shared classes — do not duplicate border/focus strings in feature forms.

### Inputs

- Frosted strong background on light UI
- Focus: forest border + 20% forest ring
- Hover: sage border
- Placeholder: stone-400

### Tables

- Wrap in `TableShell` (frosted container, horizontal scroll)
- Header row: stone-500 uppercase or semibold labels
- **Direction:** Subtle row hover wash (`hover:bg-stone-50/80`) — not yet global
- Dense data: no glass behind cell text — shell only

### Badges

`Badge` component — tones: `neutral`, `green`, `amber`, `red`

- Pill shape, soft ring, backdrop blur
- Pending request counts on nav use compact red badge (exception — high salience)

### Modals

**Current:** No shared `Modal` component. Patterns:
- `PickerPopover` — anchored dropdown
- `MobileSheet` in `admin-nav` — bottom sheet
- `DriverCustomerInfoSheet` — driver bottom sheet

**Direction:** Extract shared `Sheet` primitive (scrim + slide-up + focus trap) when a third consumer appears. Until then, copy sheet pattern from admin-nav.

### Navigation

| Role | Pattern |
|------|---------|
| Admin desktop | Horizontal nav, forest active pill |
| Admin mobile | Fixed bottom bar (glass) + People/More sheets |
| Owner | Tab-style top nav under header |
| Driver | Day tabs (Today/Tomorrow) segmented control |
| Landing | Sticky opaque header, anchor links |

**Rule:** Sticky headers = **opaque** (`.surface-header`). Bottom sheets and dropdowns = glass.

### Maps

**Current:** No embedded map UI. Maps open via external Google Maps links from driver customer sheet.

**Direction:** If map UI is added — minimal chrome, high contrast, offline-tolerant fallback, never block stop actions. Map is context, not the primary driver interface.

### Driver cards

`driver-stop-list.tsx` — canonical pattern:

- Dog name (xl semibold) + info button
- Owner, address, window (descending emphasis)
- Progress steps: En Route → Arrived → Picked Up/Dropped Off
- Travel connector: amber→sky gradient progress line
- One primary action button per state
- Completed: green wash + “Done” pill

**Rules:** Optimistic UI on every tap. `active:scale-[0.98]`. No hamburger menus per stop.

### Customer cards

Admin customer/dog detail pages — standard admin `Card` + tables. No separate “customer card” component yet.

**Direction:** Customer summary cards on dashboard/route views should show: dog name, window, status, driver — scannable in under 2 seconds.

### Notifications

- Admin: notifications log table
- SMS: automated templates (night-before, ETA, pickup/drop-off)
- In-app: `Badge` for pending requests; no notification bell UI yet

**Direction:** Copy follows [Voice](#voice). In-app alerts prefer inline banners over toasts for office; driver uses ephemeral feedback bar.

### Timeline components

Driver stop progress steps are the primary timeline pattern.

**Direction:** Office route timeline (future) should be vertical, stop-ordered, status-colored — not Gantt charts.

### Charts

`trend-chart.tsx`, owner analytics — basic containers with `rounded-xl border` (not fully migrated).

**Direction:** Charts sit on `.surface-card`, minimal gridlines, forest/sky series colors, no chartjunk.

### Empty states

Use `EmptyState` or dashed `surface-card`. Include next-step link when obvious.

---

## Motion

### Animation timing

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 150ms | Hover, color, border, driver tap feedback |
| `--duration-normal` | 220ms | Popover enter, sheet slide |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.25, 0.64, 1)` | Popover/sheet enter |

### Durations

- Enter overlays: 220ms max
- Hover lifts: 150ms
- Driver travel progress bar: linear, tied to GPS updates — not eased for delight

### Spring settings

Spring easing on **enter only** (popover-in, sheet-up). No spring on every hover.

### Hover behavior

- Cards: shadow lift to `--elevation-3`
- Buttons: gradient shift + shadow (primary); shadow only (secondary glass)
- Nav: background wash, not scale
- Links: underline on hover (text links)

### Page transitions

**Current:** None (Next.js hard navigation).

**Direction:** No page transition animations unless they aid orientation without slowing driver flows. Admin may adopt subtle fade later — driver never.

### Loading animations

- `animate-pulse` skeletons — keep opacity soft
- No full-screen spinners on driver route

### Micro interactions

- Driver button `scale(0.98)` on active
- Popover fade + 0.98→1 scale on open
- Sheet slide-up 12px
- Checkbox/radio: 150ms border/fill transition

### What should never animate

- Table row reorder (instant reflect)
- Stop completion state (optimistic snap, not slow morph)
- Error appearance (instant, stable)
- Text content / numbers counting up
- Continuous looping decoration
- Blur intensity on scroll (performance + motion sickness)
- Anything when `prefers-reduced-motion: reduce` is set

---

## Voice

PackRoute speaks like a **capable office manager who hikes on weekends** — clear, warm, never performative.

### Tone attributes

| ✅ Be | ❌ Avoid |
|-------|----------|
| Friendly | Robotic (“Action completed successfully”) |
| Professional | Overly corporate (“Leverage our solution”) |
| Clear | Verbose (“At this point in time…”) |
| Confident | Playful (“Pawsome!” / emoji spam) |
| Plain English | Jargon (“Sync your roster entities”) |
| Specific | Vague (“Something went wrong”) |

### UI copy patterns

- **Buttons:** Verb-first — “Save changes”, “Export CSV”, “En Route”
- **Headings:** Nouns or outcomes — “Today’s operations”, not “Operations module”
- **Empty states:** Factual — “No dogs on this route today.”
- **Errors:** Problem + action — “Could not save. Check your connection and try again.”
- **SMS:** Customer name, dog name, window, driver — one update per event, no marketing

### Role-specific voice

| Role | Voice |
|------|-------|
| Admin | Efficient, respectful of time |
| Driver | Direct, scannable, zero fluff |
| Customer SMS | Reassuring, human, signed by the business |
| Landing | Confident, niche-specific, honest about scope |
| Legal | Plain language where possible; formal when required |

---

## UX Philosophy

1. **Office owns schedules** — Routes, approvals, billing prep, customer policy live in admin.
2. **Drivers own execution** — Taps reflect reality; software never auto-sends without driver intent.
3. **Software reduces interruptions** — Every feature should reduce texts, calls, and “quick questions.”
4. **Customers receive confidence through communication** — Proactive SMS beats reactive support.
5. **Every interaction should reduce operational friction** — If it adds steps, justify it or remove it.
6. **One question per driver screen** — “What should I do next?”
7. **Trust through transparency** — Office sees route status; customers see ETAs; drivers see customer notes.
8. **Changes go through the office** — Skip requests, schedule edits — reviewed before applied.

---

## Implementation Rules

### Extend, do not duplicate

- Import from `button-styles.ts`, `form-styles.ts`, `ui.tsx`, `picker-styles.ts`
- Use `Card`, `Badge`, `TableShell`, `EmptyState` before inventing wrappers
- New surfaces → add utility to `globals.css` if reused 3+ times

### Tailwind tokens

- Define colors, radius, motion in `:root` and `@theme` — not scattered hex in components
- Use `var(--color-forest)` not `#1f5a4a` in new code (legacy gradient exception to migrate)
- Prefer semantic utilities (`.surface-elevated`) over long arbitrary class strings

### Composition over new components

- Prefer class strings + existing primitives over a component library
- Extract a component when the same JSX structure appears 3+ times with behavior

### Performance

- Limit `backdrop-filter` to small regions (headers, cards, popovers) — not full viewport
- Driver: optimistic UI, non-blocking actions, minimal re-renders on stop list
- No client animation libraries

### Accessibility

- `min-h-11` touch targets
- Visible focus states
- Semantic color tokens (Badge tones, not raw red-500 text alone)
- Test driver view in bright sunlight

### Avoid arbitrary values

- Radius: token only (`--radius-surface`, `--radius-card`)
- Shadow: `--elevation-*`
- Spacing: Tailwind scale (4, 5, 6, 8…) — no `p-[13px]`

### File reference map

| Concern | File |
|---------|------|
| Tokens + utilities | `src/app/globals.css` |
| Buttons | `src/features/admin/components/button-styles.ts` |
| Forms | `src/features/admin/components/form-styles.ts` |
| Primitives | `src/features/admin/components/ui.tsx` |
| Pickers | `src/features/admin/components/picker-*.ts(x)` |
| Admin shell | `src/app/(admin)/layout.tsx` |
| Driver shell | `src/app/(driver)/layout.tsx` |
| Driver stops | `src/features/driver-actions/components/driver-stop-list.tsx` |

---

## Inspiration

What to borrow — and what to leave behind.

| Reference | Borrow | Do not borrow |
|-----------|--------|---------------|
| **Modern Frutiger Aero** | Optimistic natural light, sky/forest/water palette, sense of openness | Gloss overload, stock nature wallpaper, skeuomorphic bubbles |
| **Apple Liquid Glass** | Depth through blur and elevation, calm motion, opaque nav when scrolling | Excessive transparency, frosted everything, iOS mimicry for its own sake |
| **Swiss typography** | Grid discipline, typographic hierarchy, generous whitespace, restrained color | Cold sterility, no warmth for small-business users |
| **Linear** | Speed, keyboard-friendly density, subtle borders, dark mode quality | Issue-tracker metaphors, keyboard-first assumptions for drivers |
| **Basecamp** | Calm, opinionated simplicity, friendly prose, one primary action | Project-management patterns irrelevant to routes |
| **Apple (general)** | Clarity, touch targets, reduced chrome, trustworthy defaults | Closed-ecosystem assumptions, modal-heavy flows |
| **Modern transportation software** | Route status, ETA clarity, driver-first mobile, high contrast | Fleet surveillance UI, complex dispatch maps as default |
| **Weather applications** | Atmospheric gradients, time-of-day mood, glanceable status | Playful weather icons, noisy data visualization |
| **Nature** | Color inspiration, calm pacing, “morning route” rhythm | Literal tree icons everywhere, rustic/craft aesthetic |

**North star aesthetic:** Premium 2030 outdoor operations tool — sky and forest light, floating surfaces, instant driver actions, trustworthy office calm.

---

## Future Decision Checklist

Before shipping any feature, confirm:

- [ ] Does it **reduce stress** for office, driver, or customer?
- [ ] Does it **reduce clicks** on the critical path (especially driver)?
- [ ] Does it **improve clarity** — obvious what happened and what’s next?
- [ ] Would a **driver understand it instantly** in sunlight, one-handed?
- [ ] Would **office staff need less training** because it matches existing patterns?
- [ ] Does it **reinforce trust** (customer confidence, driver autonomy)?
- [ ] Does it feel **calm** — not noisy, clever, or surveillance-y?
- [ ] Does it **match the design language** (tokens, components, voice)?
- [ ] Does it support the **daily route** (VISION.md test)?
- [ ] Is it **accessible** (contrast, touch targets, reduced motion)?

If more than two answers are “no,” redesign or descope before building.

---

## Current State vs. Guidelines — Prioritized Improvements

Assessment of the codebase against this document (June 2026, `design/liquid-glass` branch).

### P0 — High impact, aligns with existing system

1. **Migrate remaining admin form shells to shared surfaces** — ~20 files still use inline `rounded-xl border border-stone-200 bg-white` instead of `Card` / `surface-card` (settings, pending-requests, platform forms, hike sections). *Reduces visual drift.*
2. **Centralize primary button gradient hex** — `#267a66` in `button-styles.ts` should become a `--color-cta-top` token. *Single source of truth.*
3. **Migrate all text inputs to `form-styles.ts`** — Many feature forms still define local input classes. *Consistency and faster form building.*
4. **Admin mobile bottom nav opacity** — Bottom bar still uses translucent `surface-glass`; consider opaque bar matching sticky header decision. *Readability while scrolling.*

### P1 — Polish and completeness

5. **Extract shared `Sheet` primitive** — Admin mobile nav, driver customer sheet, and future modals share behavior (scrim, escape, scroll lock). *Reduce duplication.*
6. **Table row hover wash** — Add subtle hover to dense admin tables via shared table styles. *Scanability.*
7. **Chart/analytics container migration** — `trend-chart.tsx`, owner panels to `surface-card` / `MetricCard` patterns. *Owner dashboard cohesion.*
8. **Retire `--color-trail-*` aliases gradually** — Map usages to semantic forest/ink/sky tokens in new code; document migration in PRs. *Naming clarity.*
9. **Standardize admin `PageHeader` + `Card` on all dashboard sub-pages** — Some pages mix raw sections and components. *Vertical rhythm.*

### P2 — Future direction

10. **Photography / illustration system** — Landing still CSS mockups only; define art direction before custom photography. *Marketing trust.*
11. **SMS copy style guide appendix** — Codify template patterns (night-before, ETA, confirmation) alongside design guidelines. *Voice consistency.*
12. **Embedded map UI (if ever built)** — Follow driver-first, minimal chrome rules; external links remain acceptable MVP.
13. **Sortable list / drag-handle styling** — Align reorder UI (route stops) with elevation and motion tokens.
14. **Optional admin page fade transition** — Only if measurable UX benefit; never on driver paths.
15. **Dark mode for admin** — Not current scope; driver dark shell is the outdoor high-contrast answer for now.

### What is already aligned ✅

- Brand palette and typography tokens in `globals.css`
- Shared button, form, picker, and UI primitives
- Liquid glass atmosphere on layout shells
- Opaque sticky headers (admin, owner, landing, driver)
- Driver stop card pattern (progress, optimistic UI, tap feedback)
- Custom date/time pickers with brand styling
- Global checkbox/radio/touch target accessibility baseline
- `prefers-reduced-motion` support on motion utilities
- Landing + legal hero atmosphere; metric cards and mockups on elevated surfaces

---

## Related documents

- [VISION.md](./VISION.md) — Product mission, route-first philosophy, feature gate
- [docs/TEST-LOGINS.md](./docs/TEST-LOGINS.md) — Role-based test accounts for design QA

When product and design conflict, **VISION wins on scope**; **this document wins on execution**.
