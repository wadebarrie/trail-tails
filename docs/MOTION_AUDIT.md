# PackRoute Motion & Interaction Audit

**Branch:** `feature/motion-polish` · **Date:** July 2026  
**Purpose:** Inventory existing motion before refinement. No redesign — consolidate and extend.

---

## Token layer (`src/app/globals.css`)

| Token / utility | Value / behavior | Used by |
|-----------------|------------------|---------|
| `--duration-fast` | 150ms | `.motion-interactive`, form focus |
| `--duration-normal` | 220ms | Popover/sheet enter |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.25, 0.64, 1)` | Popover/sheet keyframes |
| `.motion-interactive` | color, bg, border, shadow, transform, opacity @ 150ms | Buttons, cards, pickers, driver UI |
| `.motion-popover` | `popover-in` 220ms spring | Picker popover, admin nav dropdown |
| `.motion-sheet` | `sheet-up` 220ms spring | Admin mobile sheets, landing mobile nav, driver customer sheet |
| `prefers-reduced-motion` | Disables animations/transitions on motion utilities | Global |

**Form controls (base layer):** Checkboxes, radios, native date inputs use hardcoded `0.15s ease` — aligned in spirit but not wired to tokens.

**Missing before polish:** `--duration-instant`, press utility, card lift, table row hover utility, feedback enter/exit, success fade, skeleton soften.

---

## Hover behaviors

| Pattern | Location | Notes |
|---------|----------|-------|
| Card shadow lift | `ui.tsx` Card, landing cards | `hover:shadow-[elevation-3]` via `.motion-interactive` |
| Button gradient + shadow | `button-styles.ts` | Primary/secondary — consistent |
| Picker border + shadow | `picker-styles.ts` | Sage hover border — consistent |
| Table row `hover:bg-stone-50` | dogs, customers, drivers, logs, billing pages | **No transition** — abrupt |
| Table row `hover:bg-stone-50/80` | `company-usage-table.tsx` | Inconsistent opacity vs other tables |
| Link underline | Widespread | Color + underline, mostly no motion class |
| Nav pills | `admin-nav.tsx` | Background wash; chevron `transition` only |
| Sortable drag handle | `sortable-list.tsx` | Background hover, no motion token |
| Driver day nav tabs | `driver-day-nav.tsx` | Text color via `.motion-interactive` |

---

## Click / press states

| Pattern | Location | Notes |
|---------|----------|-------|
| `active:scale-[0.98]` | Driver stop buttons, info button, location pill, customer sheet Maps link | **Good** — instant tactile feedback |
| `active:scale-[0.98]` | `driver-daily-briefing.tsx` | Uses bare `transition` not `motion-interactive` |
| Primary buttons (admin) | `button-styles.ts` | Gradient darken only — **no press scale** |
| Danger/remove | `sortable-list.tsx` | No press feedback |

---

## Loading indicators

| Pattern | Location | Notes |
|---------|----------|-------|
| `animate-pulse` skeletons | `dashboard/loading.tsx`, `hikes/loading.tsx`, `driver/loading.tsx` | Shape-matched; default Tailwind pulse |
| Button `Saving…` / `pending` | `SubmitButton`, `form-submit-button`, login form | Text swap, disabled opacity |
| `useTransition` + text | `sortable-list`, `sync-routes-button`, `complete-hike-button`, pending requests | Inline status text, no skeleton |
| Driver optimistic UI | `driver-day-state.tsx` + stop list | **Strong** — status updates before network |
| `animate-pulse` dots | `location-services-indicator.tsx` | GPS waiting states |

**No full-screen spinners.** Good alignment with philosophy.

---

## Success states

| Pattern | Location | Notes |
|---------|----------|-------|
| Driver feedback toast | `driver-feedback.tsx` | Fixed bottom bar, 3.2s auto-dismiss, **no enter animation** |
| Exception added banner | `exception-added-banner.tsx` | Static green panel + smooth scroll to list |
| Optimistic stop completion | Driver stop list | Green card wash — instant |
| Form redirect / revalidate | Server actions | No in-app toast |

---

## Error states

| Pattern | Location | Notes |
|---------|----------|-------|
| Inline `text-red-600` | Forms, sortable list, pending requests | Static text, no animation |
| Driver feedback | Same toast component | Used for errors too |
| Sortable revert | On reorder error, list resets | No shake — good |

**No harsh shake or flash.** Recoverable tone is mostly there; errors could use gentle fade-in.

---

## Modal / drawer / popover animations

| Component | Animation | File |
|-----------|-----------|------|
| Picker popover | `.motion-popover` (fade + scale 0.98→1) | `picker-popover.tsx` |
| Admin nav dropdown | `.motion-popover` | `admin-nav.tsx` |
| Admin mobile sheet | `.motion-sheet` (slide up 12px) | `admin-nav.tsx` MobileSheet |
| Landing mobile nav | `.motion-sheet` | `landing-header.tsx` |
| Driver customer sheet | `.motion-sheet` on panel; scrim instant | `driver-customer-info-sheet.tsx` |
| Pending decline inline | None | `pending-request-actions.tsx` |

**No shared Sheet primitive** — behavior duplicated 3× but animations aligned.

---

## Toast / notification behavior

- **Only driver in-app toast:** `DriverFeedbackProvider` — single message, no queue, no enter/exit motion.
- **No admin toast system** — errors inline on forms/pages.
- **SMS/notifications** — backend; no UI animation.

---

## Navigation transitions

- Next.js hard navigation — **no page transitions** (intentional per DESIGN_GUIDELINES).
- Admin nav chevron rotates 180° on open — bare `transition`.
- FAQ `group-open:rotate-45` on landing — decorative, acceptable.

---

## Map interactions

- **No embedded map UI.** External Google Maps links from driver customer sheet only.
- **N/A** for animation audit until map UI exists.

---

## Route / drag interactions

| Feature | Library | Motion |
|---------|---------|--------|
| Stop reorder (admin) | `@dnd-kit` | Transform + library `transition`; drag shadow |
| Driver pickup reorder | Same sortable pattern | Dark variant |
| Route dog ordering | `sortable-list.tsx` | Optimistic reorder + `Saving order…` text |

**Opportunity:** Unify drag row styling with motion tokens; add subtle transition on row hover.

---

## Driver interactions (summary)

| Interaction | Feedback | Gap |
|-------------|----------|-----|
| En Route / Arrived / Complete | Optimistic + scale press | Travel tick uses `duration-300` not token |
| Progress steps | Bare `transition` on circles | Should use `motion-interactive` |
| Info sheet open | Sheet animation | Good |
| Daily briefing start | Scale only | Missing `motion-interactive` |
| Location pill | Pulse + scale | Good |

---

## Office / admin interactions (summary)

| Interaction | Feedback | Gap |
|-------------|----------|-----|
| Dashboard card links | Card hover elevation | Good |
| Table browse | Row hover | Abrupt, inconsistent opacity |
| Approve/decline request | Button pending text | No success reassurance toast |
| Form save | Saving… on button | Good |
| Bulk import | File input hover | One-off styles |

---

## Inconsistencies identified

1. **Dual transition systems** — `.motion-interactive` vs bare `transition` / `duration-300` in driver UI.
2. **Press scale only on driver** — admin primary buttons lack subtle compress.
3. **Table hovers** — mix of `stone-50` and `stone-50/80`, no shared transition.
4. **Feedback toast** — appears/disappears instantly.
5. **Success banners** — no entrance motion.
6. **Checkbox/radio** — hardcoded 150ms not referencing CSS variables.
7. **Card hover** — shadow only, no micro lift (design brief asks for tiny lift).
8. **Sortable rows** — dnd-kit transition separate from design tokens.

---

## Duplicated patterns (consolidation targets)

- `active:scale-[0.98]` repeated on 6+ driver class strings → `.motion-press`
- `hover:bg-stone-50` on 8+ table rows → `.motion-table-row`
- `transition active:scale-[0.98]` on briefing button → shared press + interactive
- Popover/sheet animations already centralized in CSS — keep

---

## Missing feedback (opportunities)

- Quiet enter/exit on driver feedback toast
- Fade-in on success banners (exception added)
- Fade-in on inline error messages (optional, subtle)
- Admin table row hover transition
- Primary button press acknowledgment (subtle scale)
- Card micro-lift on hover
- Decline panel expand — gentle fade (pending requests)

---

## What works well (preserve)

- Optimistic driver stop updates
- CSS-only motion (no Framer Motion)
- `prefers-reduced-motion` on motion utilities
- Popover/sheet spring enter
- No blocking loading overlays on driver path
- Skeleton loaders match layout
- No celebratory success modals

---

## Polish plan (this branch)

1. Extend token layer: instant/slow durations, `.motion-press`, `.motion-lift`, `.motion-table-row`, `.motion-feedback`, `.motion-fade-in`
2. Add `motion-styles.ts` exporting shared class strings
3. Wire tokens into buttons, cards, tables, driver UI, feedback toast, success banner
4. Document in `MOTION_GUIDELINES.md`

**Out of scope:** Page transitions, map UI, admin toast system, full form migration.

---

## Improvements made (feature/motion-polish)

| Change | Why it improves UX |
|--------|-------------------|
| Extended timing tokens (`instant`, `slow`, `ease-out`) | Single vocabulary for 100–300ms range; easier consistency |
| Added `.motion-press` on all buttons via `motionButtonClassName` | Admin taps now feel as acknowledged as driver taps |
| Added `.motion-lift` on `Card` + landing feature cards | Hover feels like physical surfaces, not flat HTML |
| Added `.motion-table-row` on 6 data tables | Row hover no longer snaps — scanning feels fluid |
| Consolidated driver `active:scale-[0.98]` → `driverActionButtonClassName` | One source of truth; easier to tune press globally |
| Driver feedback toast enter + exit animation | Actions feel heard; dismiss is gentle not abrupt |
| Exception + decline panel + error `motion-fade-in` | Success/errors appear with quiet clarity, not pop-in |
| Softer `.motion-skeleton` (2s, 55% opacity) | Loading feels less anxious than default pulse |
| Wired form control transitions to CSS tokens | Checkbox/radio aligned with motion system |
| Created `motion-styles.ts` + `MOTION_GUIDELINES.md` | Future features extend primitives instead of duplicating |
| Preserved optimistic driver UI, dnd-kit drag, popover/sheet springs | Working patterns kept — refinement only |
