/** Shared SEO copy — keep in sync with visible landing page messaging. */
export const SITE_NAME = "PackRoute";

export const SITE_TAGLINE =
  "Dog walking route planning for adventure hike teams";

export const SITE_DESCRIPTION =
  "Dog walking route planning software for adventure dog hiking teams. Plan pickup routes, guide drivers, and keep customers updated by SMS — without spreadsheet chaos.";

export const SITE_DESCRIPTION_SHORT =
  "Dog walking software for pickup routes, group hikes, driver workflows, and customer SMS.";

export const SITE_KEYWORDS = [
  "dog walking software",
  "dog walker software",
  "dog walking business software",
  "dog walking scheduling software",
  "dog walking management software",
  "dog walking route planner",
  "dog walker route planner",
  "route planner for dog walkers",
  "dog walking route app",
  "dog walking route optimization",
  "pet sitting and dog walking software",
  "pet care business software",
  "adventure dog hiking software",
  "dog hiking business software",
  "dog hiking route planner",
  "group dog walk software",
  "pack walk software",
  "PackRoute",
] as const;

export const SITE_CONTACT_EMAIL = "hello@packroute.app";

export const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const HOME_H1 =
  "Dog walking route planning software for adventure dog hiking teams";

export const DOG_WALKING_SOFTWARE_TITLE =
  "Dog Walking Route Planner for Adventure Dog Hiking Teams";

export const DOG_WALKING_SOFTWARE_DESCRIPTION =
  "Plan pickup routes, guide drivers, and send customer updates with PackRoute — dog walking route planning software built for adventure dog hiking and group dog walking businesses.";

export const ADVENTURE_DOG_HIKING_SOFTWARE_TITLE =
  "Adventure Dog Hiking Software for Group Walks & Pickup Routes";

export const ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION =
  "Operations software for adventure dog hiking teams: multi-driver pickup routes, group hike scheduling, driver workflows, and proactive customer SMS.";

type FaqItem = { readonly q: string; readonly a: string };

/** Full FAQ for structured data and SEO pages. */
export const LANDING_FAQ: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "PackRoute is operations software for adventure dog hiking teams. Your office plans routes and schedules; drivers run the day from their phone; customers get SMS updates — without spreadsheet chaos or endless group chats.",
  },
  {
    q: "Is PackRoute dog walking software?",
    a: "Yes — PackRoute is dog walking software built for companies that run pickup routes, group hikes, and pack walks. It is not a generic pet sitting app or consumer dog-walker marketplace. The best fit is operators with multiple drivers and dozens to hundreds of active dogs.",
  },
  {
    q: "Does PackRoute work for adventure dog hiking companies?",
    a: "Yes. PackRoute is designed for adventure dog hiking teams: recurring dogs, morning and afternoon routes, multi-driver days, pickup and drop-off stops, and customer communication around real field operations.",
  },
  {
    q: "Can PackRoute help plan dog walking pickup routes?",
    a: "Yes. You build daily route plans, set pickup order, assign drivers, and adjust windows for today or tomorrow. Drivers follow the plan on the road — PackRoute does not auto-rewrite your route mid-day.",
  },
  {
    q: "Can drivers use PackRoute on the road?",
    a: "Yes. Drivers use a mobile Today view in the browser — stops in order, status taps, optional pickup reorder. No app store download required.",
  },
  {
    q: "Does PackRoute send customer updates?",
    a: "Yes. Night-before reminders, en-route ETAs, and pickup or drop-off confirmations when drivers update stops. Schedule change requests by text go to your office for approval first.",
  },
  {
    q: "Is PackRoute built for pet sitting businesses too?",
    a: "Some pet care businesses may find parts of PackRoute useful, but it is optimized for adventure dog hiking, group walks, and pickup-route operations — not in-home pet sitting or one-off visits.",
  },
  {
    q: "Do customers need to download an app?",
    a: "No. They get SMS updates and can reply by text. No account, no login.",
  },
  {
    q: "What happens when a customer texts a schedule change?",
    a: "Their message becomes a pending request in your office dashboard. Nothing changes until your team approves it.",
  },
  {
    q: "Does PackRoute handle payments or invoicing?",
    a: "No. It tracks completed hikes by date range and exports CSV so you can bill in QuickBooks or your own process.",
  },
];

/** Conversion-focused FAQ shown on the homepage. */
export const LANDING_FAQ_VISIBLE: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "Operations software for adventure dog hiking teams — routes, drivers, customer SMS, and billing prep in one place.",
  },
  {
    q: "Can drivers use PackRoute on the road?",
    a: "Yes. A mobile Today view in the browser — stops in order and simple status taps. No app store required.",
  },
  {
    q: "Does PackRoute send customer updates?",
    a: "Yes. Reminders, ETAs, and pickup confirmations by SMS when drivers update stops.",
  },
  {
    q: "What happens when a customer texts a schedule change?",
    a: "It becomes a pending request in your dashboard. Nothing changes until your team approves it.",
  },
  {
    q: "Does PackRoute handle payments or invoicing?",
    a: "No. It tracks completed hikes and exports CSV for QuickBooks or your own billing process.",
  },
  {
    q: "Do customers need to download an app?",
    a: "No. SMS only — no account or login.",
  },
];

/** Prevent indexing of authenticated / internal app surfaces. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
