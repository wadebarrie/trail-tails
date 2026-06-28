/** Shared SEO copy — keep in sync with visible landing page messaging. */
export const SITE_NAME = "PackRoute";

export const SITE_TAGLINE = "Dog hike operations, simplified";

export const SITE_DESCRIPTION =
  "Schedules, SMS updates, and a simple driver app for dog hiking companies. Keep customers informed without the text thread chaos.";

export const SITE_DESCRIPTION_SHORT =
  "Schedules, SMS updates, and a simple driver app for dog hiking companies.";

export const SITE_KEYWORDS = [
  "dog hiking software",
  "dog adventure business software",
  "dog hike scheduling",
  "pet transportation SMS",
  "dog hiking route management",
  "PackRoute",
] as const;

export const SITE_CONTACT_EMAIL = "hello@packroute.net";

export const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const HOME_H1 =
  "Operations Software for Dog Hiking Companies";

/** Used for FAQ structured data — must match landing page FAQ copy. */
export const LANDING_FAQ = [
  {
    q: "Do customers need to download an app?",
    a: "No. Customers receive SMS updates and can reply by text.",
  },
  {
    q: "Can schedule changes happen automatically?",
    a: "No. Customer texts create pending requests. The office approves before schedules change.",
  },
  {
    q: "Does PackRoute optimize routes automatically?",
    a: "No. You set the order. Drivers follow the route.",
  },
  {
    q: "What if GPS fails?",
    a: "Drivers can still update stops manually.",
  },
  {
    q: "Does it work on iPhone and Android?",
    a: "Yes. The driver app is mobile web.",
  },
  {
    q: "Is pricing available?",
    a: "Book a demo or get early access — we’ll walk you through pricing for your operation.",
  },
] as const;

/** Prevent indexing of authenticated / internal app surfaces. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;
