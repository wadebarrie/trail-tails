/** Shared SEO copy — keep in sync with visible landing page messaging. */
export const SITE_NAME = "PackRoute";

export const SITE_TAGLINE = "Software for adventure dog hiking teams";

export const SITE_DESCRIPTION =
  "Plan routes, run multi-driver days, and keep customers updated by SMS. The office owns the schedule; drivers run the route from their phone.";

export const SITE_DESCRIPTION_SHORT =
  "Route planning, driver updates, and customer SMS for dog hiking companies.";

export const SITE_KEYWORDS = [
  "dog hiking software",
  "dog adventure business software",
  "dog hike scheduling",
  "pet transportation SMS",
  "dog hiking route management",
  "multi-driver dog hiking",
  "PackRoute",
] as const;

export const SITE_CONTACT_EMAIL = "hello@packroute.app";

export const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const HOME_H1 =
  "Software for adventure dog hiking companies";

/** Used for FAQ structured data — must match landing page FAQ copy. */
export const LANDING_FAQ = [
  {
    q: "Do customers need to download an app?",
    a: "No. They get SMS updates and can reply by text. No account, no login.",
  },
  {
    q: "What happens when a customer texts a schedule change?",
    a: "Their message becomes a pending request in your office dashboard. Nothing changes on the route until your team approves it.",
  },
  {
    q: "Does PackRoute optimize routes automatically?",
    a: "No. You set pickup order and assign routes in the office. Drivers follow that plan — and can reorder pickups before the route starts. The software does not rewrite your route mid-day.",
  },
  {
    q: "How does location work for drivers?",
    a: "Drivers can always tap Arrived manually. When location is enabled, arrival near a stop can update automatically — mainly to trigger customer texts, not to monitor drivers.",
  },
  {
    q: "Does it work on iPhone and Android?",
    a: "Yes. The driver view is mobile web — add it to the home screen and it works like an app.",
  },
  {
    q: "Does PackRoute handle payments or invoicing?",
    a: "No. It tracks completed hikes by date range and exports CSV so you can bill in QuickBooks or your own process.",
  },
  {
    q: "Is pricing available?",
    a: "Book a demo or request early access — we'll walk through pricing for your operation.",
  },
] as const;

/** Prevent indexing of authenticated / internal app surfaces. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
