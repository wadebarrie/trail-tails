/** Shared SEO copy — keep in sync with visible landing page messaging. */
import { BUYER_QUESTION_FAQ } from "@/features/landing/buyer-questions";

export const SITE_NAME = "PackRoute";

export const SITE_TAGLINE =
  "Customer updates without the busywork";

export const SITE_DESCRIPTION =
  "Stop living in group chats. PackRoute texts owners for you — night-before reminders, ETAs, and pickup updates — so your office gets time back and families always know what's going on. Built for dog walking and adventure hiking teams.";

export const SITE_DESCRIPTION_SHORT =
  "Hours back for the office. Automated customer updates for walking and hiking teams.";

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
  "Stop living in group chats. Give customers updates without the busywork.";

export const DOG_WALKING_SOFTWARE_TITLE =
  "Dog Walking Software That Gives the Office Hours Back";

export const DOG_WALKING_SOFTWARE_DESCRIPTION =
  "Stop answering “where's my dog?” all morning. PackRoute texts owners for you — reminders, ETAs, and pickup updates — so walking and hiking teams get time back and families stay in the loop.";

export const ADVENTURE_DOG_HIKING_SOFTWARE_TITLE =
  "Adventure Dog Hiking Software — Hours Back, Happier Owners";

export const ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION =
  "Adventure dog hiking software that saves office time and keeps customers updated: night-before reminders, en-route ETAs, and pickup confirmations — with multi-driver routes and office-approved skip requests behind the scenes.";

export const TIME_TO_PET_ALTERNATIVE_TITLE =
  "Lightweight Canadian Time to Pet Alternative for Dog Hiking Teams";

export const TIME_TO_PET_ALTERNATIVE_DESCRIPTION =
  "A lighter, CAD-priced Time to Pet alternative for Canadian adventure dog hiking teams. PackRoute handles group hike time slots, multi-driver pickup routes, and customer SMS — without paying for boarding and pet-sitting features you do not use.";

export const BARKBUS_ALTERNATIVE_TITLE =
  "BarkBus Alternative for Adventure Dog Hiking & Pickup Routes";

export const BARKBUS_ALTERNATIVE_DESCRIPTION =
  "Looking for a BarkBus alternative focused on adventure dog hiking pickups? PackRoute plans multi-van routes, guides drivers on mobile web, and updates customers by SMS — without an owner app or AI booking suite.";

export const PRICING_TITLE = "PackRoute Pricing — First Month Free (CAD)";

export const PRICING_DESCRIPTION =
  "Canadian pricing by drivers and dogs for walking and hiking teams. First month free, no card required to start. Beta rates from CA$99/month — every tier includes routes, group hike slots, and automated customer SMS.";

type FaqItem = { readonly q: string; readonly a: string };

/** Full FAQ for structured data and SEO pages. */
export const LANDING_FAQ: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "PackRoute is operations software for walking and hiking teams that saves office time and keeps customers updated. Customers get automated reminders, ETAs, and pickup texts; drivers tap status on their phone; the office plans routes and approves schedule changes — without spreadsheet chaos or endless WhatsApp group chats.",
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
    a: "Yes. Drivers use a mobile Today view in the browser — stops in order, status taps, optional pickup reorder. Those taps trigger customer SMS. No app store download required.",
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
    a: "PackRoute is a lighter product focused on routes, group hike time slots, drivers, and customer SMS. Completed hikes export as CSV for QuickBooks, Xero, or e-Transfer today, and built-in CAD invoicing is on the roadmap. Hiking teams are not paying for boarding and pet-sitting workflows they do not use.",
  },
  {
    q: "Does PackRoute handle payments or invoicing?",
    a: "Today every plan includes completed-hike CSV export so you can bill in QuickBooks, Xero, or e-Transfer. Built-in CAD invoicing and payments are coming soon. Live QuickBooks Online and Xero sync are optional paid add-ons. See packroute.app/pricing for current CAD plans.",
  },
  {
    q: "How much does PackRoute cost?",
    a: "Beta pricing is in CAD: CA$99/month for one driver (up to 20 dogs/week), CA$179 for two drivers (up to 40 dogs/week), and CA$299 for three or more drivers (up to 70 dogs/week). First month free after a short demo. Every tier includes the same features — tiers only change capacity. Subscribe during beta and your rate is locked. Details at packroute.app/pricing.",
  },
  {
    q: "Is PackRoute priced in Canadian dollars?",
    a: "Yes. Public pricing is in CAD for Canadian walking and hiking teams. First month free after a demo.",
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
  ...BUYER_QUESTION_FAQ,
];

/** Conversion-focused FAQ shown on the homepage. */
export const LANDING_FAQ_VISIBLE: readonly FaqItem[] = [
  {
    q: "What is PackRoute?",
    a: "Operations software for walking and hiking teams that gives the office hours back and keeps customers updated — automated reminders, ETAs, and pickup texts, backed by routes and a mobile driver workflow.",
  },
  {
    q: "Will this actually save us time?",
    a: "Yes. The office stops answering “where's my dog?” and mediating WhatsApp. Drivers tap status on the road; PackRoute texts owners automatically. Schedule changes wait for office approval.",
  },
  {
    q: "Can PackRoute replace Google Sheets and WhatsApp?",
    a: "Yes. Customers get SMS updates instead of group-chat chaos; drivers run Today on their phone; the office owns routes and schedule approvals.",
  },
  {
    q: "Can drivers use PackRoute on the road?",
    a: "Yes. A mobile Today view in the browser — stops in order and simple status taps. No app store required.",
  },
  {
    q: "What do customers receive?",
    a: "Night-before reminders, en-route ETAs, and pickup confirmations — sent when drivers update stops. No app or login for owners.",
  },
  {
    q: "What happens when a customer texts a schedule change?",
    a: "It becomes a pending request in your dashboard. Nothing changes until your team approves it.",
  },
  {
    q: "Does PackRoute include CRM and invoicing like Time to Pet?",
    a: "PackRoute is lighter on purpose: routes, group hike slots, drivers, and customer updates. You get CSV hike export for billing today, and CAD invoicing is on the roadmap — without paying for boarding and pet-sitting features you do not use.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams are sending real customer texts the same day. In-app setup is a vehicle, a driver, a customer, a dog, and a route, and usually takes under an hour. We also do a 30–45 minute onboarding screenshare and can import a CSV of customers and dogs.",
  },
  {
    q: "How much does PackRoute cost?",
    a: "From CA$99/month during beta (one driver). First month free after a demo. See the pricing page for CAD tiers.",
  },
  {
    q: "Is PackRoute a Time to Pet alternative?",
    a: "For Canadian adventure dog hiking teams, yes — a lighter, CAD-priced replacement focused on hours saved and customer experience, not a full pet-sitting suite.",
  },
];
/** Prevent indexing of authenticated / internal app surfaces. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
