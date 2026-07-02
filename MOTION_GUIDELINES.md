# PackRoute Motion Guidelines

> **Companion to [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)** — execution rules for animation, transitions, and micro-interactions.

**Principle:** Motion communicates. It never decorates. Users should feel natural response, not notice animations.

---

## Philosophy

PackRoute should feel **calm, responsive, and alive** — like Apple system interactions, Linear, or Raycast: physical but lightweight, premium but effortless.

| ✅ Do | ❌ Don't |
|-------|----------|
| Confirm taps instantly | Celebrate with confetti |
| Use 100–300ms transitions | Slow or bouncy interfaces |
| Prefer transform + opacity | Animate width/height/layout |
| Respect reduced motion | Rely on animation alone |
| Optimistic driver feedback | Block UI on network |
| Quiet success reassurance | Loud success modals |

---

## Timing scale

Defined in `src/app/globals.css`:

| Token | Duration | Use |
|-------|----------|-----|
| `--duration-instant` | 100ms | Press compress, feedback exit |
| `--duration-fast` | 150ms | Hover, focus, color, table rows |
| `--duration-normal` | 220ms | Popover/sheet enter, feedback enter, fade-in |
| `--duration-slow` | 280ms | Maximum for UI (use sparingly) |

**Rule:** If an interaction exceeds 300ms, it is too slow for PackRoute.

---

## Easing

| Token | Curve | Use |
|-------|-------|-----|
| `--ease-smooth` | Standard ease | Hovers, presses, color |
| `--ease-spring` | Slight overshoot | Popover/sheet **enter only** |
| `--ease-out` | Decelerate | Feedback fade-in |

No spring on hovers. No linear except progress bars tied to real data (driver travel connector).

---

## Reusable primitives

**CSS utilities** (`globals.css`) and **class strings** (`src/features/admin/components/motion-styles.ts`):

| Utility / export | Purpose |
|------------------|---------|
| `.motion-interactive` | Default 150ms transition on interactive surfaces |
| `.motion-press` / `motionPressClassName` | Subtle `scale(0.98)` on `:active` |
| `.motion-lift` / `motionLiftClassName` | 1px hover lift + elevation-3 |
| `.motion-table-row` / `motionTableRowClassName` | Smooth row hover wash |
| `.motion-link` / `motionLinkClassName` | Link color/underline transition |
| `.motion-popover` | Fade + scale enter for dropdowns |
| `.motion-sheet` | Slide-up enter for bottom sheets |
| `.motion-feedback` | Toast enter (driver) |
| `.motion-feedback-exit` | Toast exit |
| `.motion-fade-in` | Success banners, inline panels |
| `.motion-skeleton` | Softer 2s pulse for loading placeholders |
| `motionButtonClassName` | interactive + press (all buttons) |
| `motionCardClassName` | interactive + lift (cards) |
| `driverActionButtonClassName` | Full-width driver primary actions |

### Usage

```tsx
import { motionTableRowClassName } from "@/features/admin/components/ui";
import { driverActionButtonClassName } from "@/features/admin/components/motion-styles";

<tr className={motionTableRowClassName}>…</tr>
<button className={driverActionButtonClassName}>En Route</button>
```

**Always import shared strings.** Do not copy `active:scale-[0.98]` inline.

---

## Interaction rules

### Hover

- **Cards:** `.motion-lift` — tiny elevation, not bounce
- **Buttons:** gradient/shadow shift via `button-styles.ts` + `motion-press`
- **Table rows:** `.motion-table-row` — soft background wash
- **Icons:** opacity or background only when labeled; avoid scale on icon-only controls

### Click / press

- All buttons: `motion-press` (100ms compress)
- Driver primary actions: `driverActionButtonClassName`
- Danger actions: same press — deliberate, not exaggerated
- Never scale below 0.96

### Focus

- Forest ring on inputs (existing form tokens)
- Visible keyboard focus on all interactive elements
- No animated focus rings

### Selection

- Nav active states: instant forest pill (no transition delay)
- Driver progress steps: color transition via `motion-interactive`
- Sortable drag: `@dnd-kit` transform (library default) + row border emphasis

---

## Loading

**Prefer:**
- `.motion-skeleton` shape-matched placeholders
- Optimistic UI (driver stops)
- Button text: `Saving…`, `Syncing…`
- Inline `Saving order…` during drag reorder

**Avoid:**
- Full-screen spinners
- Blocking overlays on driver path
- Loading without any feedback

---

## Success

Quiet reassurance only:

- Driver toast via `DriverFeedbackProvider` — enter/exit animation, 3.2s visible
- Green banner fade-in (`motion-fade-in`) for exception added
- Optimistic card state change (driver stop → green wash)
- No celebration animations

---

## Error

- Inline red text with optional `motion-fade-in`
- Driver errors reuse feedback toast (same component)
- No shake, no red flash
- Always pair with recoverable next action

---

## Overlays

| Type | Animation | Files |
|------|-----------|-------|
| Popover | `.motion-popover` | pickers, admin nav dropdown |
| Sheet | `.motion-sheet` | admin mobile nav, landing mobile menu, driver customer info |
| Scrim | Instant (no fade) | sheets — keeps focus on panel |

---

## Driver-specific

1. **Every tap → immediate visual response** (optimistic state + press)
2. **Network never blocks feedback**
3. **No page transitions**
4. Travel progress bar: linear width transition tied to GPS
5. Location pill: pulse only while acquiring/checking GPS

---

## Office / admin-specific

1. Table rows: smooth hover via `motionTableRowClassName`
2. Cards: lift on hover for dashboard links
3. Drag reorder: optimistic list + text status
4. Decline panel: fade-in when expanded
5. No toast system yet — inline errors and button pending states

---

## Maps

No embedded map UI today. When added:
- Pin selection: instant highlight, no bounce
- Route/ETA updates: smooth polyline/progress, no jump cuts
- Panel sync with map: matched timing (220ms max)

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  /* All motion-* utilities disable animation/transition */
}
```

- Never convey state by animation alone
- Keep `aria-live="polite"` on driver feedback
- Skeleton loaders remain visible (static) under reduced motion

---

## Performance

- Animate **transform** and **opacity** only
- Avoid animating `blur`, `width`, `height`, `top`, `left`
- Limit `backdrop-filter` to small surfaces (not full viewport)
- Target 60fps on driver mid-range phones

---

## What never animates

- Table sort order snap-back on error (instant revert)
- Stop status after optimistic update (instant color)
- Page navigation (Next.js hard nav)
- Text content changes
- Continuous decorative loops
- Blur intensity on scroll

---

## Audit reference

See [docs/MOTION_AUDIT.md](./docs/MOTION_AUDIT.md) for the pre-polish inventory and gap analysis.

---

## Related files

| File | Role |
|------|------|
| `src/app/globals.css` | Tokens + `@layer utilities` |
| `src/features/admin/components/motion-styles.ts` | Exported class strings |
| `src/features/admin/components/button-styles.ts` | Button motion |
| `src/features/admin/components/ui.tsx` | Card lift, table row export |
| `src/features/driver-actions/components/driver-feedback.tsx` | Toast enter/exit |

When adding new motion, extend tokens and `motion-styles.ts` first — do not add one-off durations in components.
