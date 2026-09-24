/** Shared SEO copy — keep in sync with visible landing page messaging. */
export const SITE_NAME = "PackRoute";

export const SITE_TAGLINE =
  "Dog walking route planning for adventure hike teams";

export const SITE_DESCRIPTION =
  "Replace Google Sheets and WhatsApp for adventure dog hiking teams. Plan multi-driver pickup routes, give drivers a mobile workflow, and send automated SMS ETAs and pickup updates — without spreadsheet chaos.";

export const SITE_DESCRIPTION_SHORT =
  "Dog walking route planning software: multi-driver routes, mobile driver workflow, and automated customer SMS ETAs.";

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
  "route planning software for dog walkers",
  "replace spreadsheets dog walking",
  "dog walking ETA SMS",
  "automated SMS dog walking",
  "multi-driver dog walking software",
  "pet sitting and dog walking software",
  "pet care business software",
  "adventure dog hiking software",
  "dog hiking business software",
  "dog hiking route planner",
  "group dog walk software",
  "pack walk software",
  "time to pet alternative",
  "time to pet alternatives",
  "alternatives to time to pet",
  "time to pet for dog walking",
  "barkbus alternative",
  "barkbus alternatives",
  "alternatives to barkbus",
  "barkbus vs dog walking software",
  "pack school software alternative",
  "leashtime alternative",
  "pet sitter plus alternative",
  "gingr alternative dog walking",
  "precise petcare alternative",
  "scout dog walking software alternative",
  "PackRoute",
] as const;

export const SITE_CONTACT_EMAIL = "hello@packroute.app";

export const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const HOME_H1 =
  "Replace spreadsheets and group chats with dog walking route planning software";

export const DOG_WALKING_SOFTWARE_TITLE =
  "Dog Walking Route Planner for Adventure Dog Hiking Teams";

export const DOG_WALKING_SOFTWARE_DESCRIPTION =
  "Best way to replace spreadsheets for dog walk route planning: PackRoute plans multi-driver pickup routes, guides drivers on mobile, and sends automated SMS ETAs and pickup updates for adventure dog hiking teams.";

export const ADVENTURE_DOG_HIKING_SOFTWARE_TITLE =
  "Adventure Dog Hiking Software for Group Walks & Pickup Routes";

export const ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION =
  "Software adventure dog hiking businesses use for daily pickup routes: multi-driver mornings, recurring schedules, skip requests with office approval, and automated customer SMS — without Google Sheets and WhatsApp.";

export const TIME_TO_PET_ALTERNATIVE_TITLE =
  "Time to Pet Alternative for Adventure Dog Hiking Teams";

export const TIME_TO_PET_ALTERNATIVE_DESCRIPTION =
  "Looking for a Time to Pet alternative built for pickup routes and group dog hikes? PackRoute focuses on multi-driver route days, driver workflows, and customer SMS ETAs. It exports completed hikes for QuickBooks — it is not a full CRM or invoicing suite.";

export const BARKBUS_ALTERNATIVE_TITLE =
  "BarkBus Alternative for Adventure Dog Hiking & Pickup Routes";

export const BARKBUS_ALTERNATIVE_DESCRIPTION =
  "Looking for a BarkBus alternative focused on adventure dog hiking pickups? PackRoute plans multi-van routes, guides drivers on mobile web, and updates customers by SMS — without an owner app or AI booking suite.";

export const PRICING_TITLE = "PackRoute Pricing — First Month Free";

export const PRICING_DESCRIPTION =
  "Simple pricing by hikers/walkers and dogs for adventure dog hiking teams. First month free, no card required to start. Beta rates from $29/month USD — every tier includes routes, driver workflows, and automated customer SMS.";

type FaqItem = { readonly q: string; readonly a: string };

/** Full FAQ for structured data and SEO pages. */
export const LANDING_FAQ: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "PackRoute is operations software for adventure dog hiking teams. Your office plans routes and schedules; drivers run the day from their phone; customers get automated SMS updates — without spreadsheet chaos or endless WhatsApp group chats.",
  },
  {
    q: "Is PackRoute dog walking software?",
    a: "Yes — PackRoute is dog walking software built for companies that run pickup routes, group hikes, and pack walks. It is not a generic pet sitting app or consumer dog-walker marketplace. The best fit is operators with multiple hikers or walkers and dozens to hundreds of active dogs.",
  },
  {
    q: "Does PackRoute work for adventure dog hiking companies?",
    a: "Yes. PackRoute is designed for adventure dog hiking teams: recurring dogs, morning and afternoon routes, multi-driver days, pickup and drop-off stops, and customer communication around real field operations.",
  },
  {
    q: "What software do adventure dog hiking businesses use to manage daily pickup routes?",
    a: "Many teams start with Google Sheets and WhatsApp, then move to PackRoute when they add hikers or walkers. PackRoute is built specifically for daily pickup route planning, driver mobile workflows, and customer SMS for adventure dog hiking and group walk businesses.",
  },
  {
    q: "Can PackRoute replace spreadsheets for dog walk route planning?",
    a: "Yes. You build daily route plans, set pickup order, assign drivers, and adjust windows for today or tomorrow — without rebuilding a spreadsheet every morning. Drivers follow the plan on the road; PackRoute does not auto-rewrite your route mid-day.",
  },
  {
    q: "Can drivers use PackRoute on the road?",
    a: "Yes. Drivers use a mobile Today view in the browser — stops in order, status taps, optional pickup reorder. No app store download required. It is route planning software for dog walkers that works on mobile.",
  },
  {
    q: "Does PackRoute send automated SMS ETA and pickup updates?",
    a: "Yes. Night-before reminders, en-route ETAs, and pickup or drop-off confirmations send when drivers update stops — so customers get updates without drivers manually texting each family. Schedule change requests by text go to your office for approval first.",
  },
  {
    q: "Can customers text schedule changes that still need office approval?",
    a: "Yes. Their message becomes a pending request in your office dashboard. Nothing changes until your team approves it — useful for last-minute skips without surprise gaps on the route.",
  },
  {
    q: "Does PackRoute include CRM and invoicing like Time to Pet?",
    a: "No — and that is intentional. PackRoute is operations software for routes, drivers, and customer SMS. It tracks completed hikes by date range and exports CSV for QuickBooks or your own billing process. Mature all-in-one pet care platforms often go deeper on CRM, owner portals, and in-app invoicing; PackRoute stays focused on field-day logistics so hiking teams are not paying for boarding and pet-sitting workflows they do not use.",
  },
  {
    q: "Does PackRoute handle payments or invoicing?",
    a: "No built-in owner invoices or payment collection. It tracks completed hikes by date range and exports CSV so you can bill in QuickBooks, Stripe, or your existing process. If you need a full pet-care CRM and invoicing suite, keep or pair with Time to Pet (or similar) for that layer. See packroute.app/pricing for current plans.",
  },
  {
    q: "How much does PackRoute cost?",
    a: "Beta pricing starts at $29/month USD for one hiker (up to 40 dogs/week), $49 for two hikers (up to 120 dogs/week), and $79 for three or more hikers with unlimited dogs. First month free after a short demo. Every tier includes the same features — tiers only change capacity. Subscribe during beta and your rate is locked. Details at packroute.app/pricing.",
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
    q: "Is PackRoute a Time to Pet alternative?",
    a: "For adventure dog hiking and group pack-walk companies, yes — PackRoute is a focused alternative to Time to Pet and similar all-in-one pet care tools. It prioritizes pickup route planning, multi-driver field days, and customer SMS. It is not a full pet-sitting, boarding, daycare, or deep CRM/invoicing suite.",
  },
  {
    q: "How is PackRoute different from Time to Pet, Pet Sitter Plus, Gingr, or LeashTime?",
    a: "Those platforms are strong for broad pet sitting, daycare, CRM, and general dog walking businesses. PackRoute is built specifically for adventure dog hiking teams that run recurring pickup routes with drivers on the road. If your day is van routes, group hikes, and SMS updates — not in-home visits or facility boarding — PackRoute is the closer fit for operations. Use CSV hike exports (or keep a separate billing tool) for invoicing.",
  },
  {
    q: "Who should keep using Time to Pet or similar software?",
    a: "Operators whose core work is pet sitting, daycare, boarding, photo-and-visit reporting, or deep in-app CRM and invoicing may be better served by Time to Pet, Pet Sitter Plus, Gingr, Precise Petcare, or Scout. PackRoute is for hiking and pack-walk teams that need calmer multi-driver route operations and automated customer SMS.",
  },
];

/** Conversion-focused FAQ shown on the homepage. */
export const LANDING_FAQ_VISIBLE: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "Operations software for adventure dog hiking teams — multi-driver pickup routes, mobile driver workflow, automated customer SMS, and CSV billing prep.",
  },
  {
    q: "Can PackRoute replace Google Sheets and WhatsApp?",
    a: "Yes. The office owns routes and schedules; drivers run Today on their phone; customers get SMS ETAs and pickup updates instead of group-chat chaos.",
  },
  {
    q: "Can drivers use PackRoute on the road?",
    a: "Yes. A mobile Today view in the browser — stops in order and simple status taps. No app store required.",
  },
  {
    q: "Does PackRoute send automated SMS ETAs?",
    a: "Yes. Night-before reminders, en-route ETAs, and pickup confirmations send when drivers update stops — no manual texts from drivers.",
  },
  {
    q: "What happens when a customer texts a schedule change?",
    a: "It becomes a pending request in your dashboard. Nothing changes until your team approves it.",
  },
  {
    q: "Does PackRoute include CRM and invoicing like Time to Pet?",
    a: "No — on purpose. PackRoute focuses on routes, drivers, and SMS. It exports completed hikes as CSV for QuickBooks or your own billing. Keep a pet-care CRM if you need deep invoicing and owner portals.",
  },
  {
    q: "How much does PackRoute cost?",
    a: "From $29/month USD during beta (one hiker). First month free after a demo. See /pricing for tiers.",
  },
  {
    q: "Is PackRoute a Time to Pet alternative?",
    a: "For adventure dog hiking teams, yes — a focused alternative for pickup routes, drivers, and customer SMS, not a full pet-sitting or CRM suite.",
  },
];
/** Prevent indexing of authenticated / internal app surfaces. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
