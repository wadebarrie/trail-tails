/**
 * Buyer questions aligned to AI/search prompts (e.g. Halogen Presence checks).
 * Phrasing stays close to how operators ask ChatGPT so answers are citation-friendly.
 */

export type BuyerQuestion = {
  /** Short H2-friendly title for marketing pages */
  heading: string;
  /** Full question as a buyer would ask an AI assistant */
  q: string;
  a: string;
};

export const BUYER_QUESTIONS: readonly BuyerQuestion[] = [
  {
    heading: "Best way to replace spreadsheets for dog walk route planning",
    q: "Best way to replace spreadsheets for dog walk route planning?",
    a: "PackRoute replaces morning Google Sheets for adventure dog hiking teams: build multi-driver pickup routes, set stop order, assign hikers or walkers, and adjust today or tomorrow without rebuilding a spreadsheet. Drivers run the plan from a mobile Today view; customer SMS ETAs fire from their status taps instead of WhatsApp group chats.",
  },
  {
    heading: "Driver workflow and customer updates in one place",
    q: "My drivers are constantly texting me asking about the order of stops and customers keep calling for ETAs. Is there software that handles both the driver workflow and customer updates automatically?",
    a: "Yes. PackRoute gives drivers a mobile Today view with stops in order and simple status taps. Those taps automatically send customer SMS — night-before reminders, en-route ETAs, and pickup or drop-off confirmations — so the office is not intermediating every “where are you?” call and drivers are not manually texting each family.",
  },
  {
    heading: "Recurring schedules, skip requests, and billing exports",
    q: "We do adventure hikes with groups of dogs and I need something that can handle recurring schedules, last-minute skip requests, and billing exports. What tools exist for this?",
    a: "PackRoute is built for that combo: recurring dogs on morning and afternoon routes, customer texts for last-minute skips that wait for office approval, and completed-hike CSV export for QuickBooks or your own invoicing. It is field-day and SMS software — not a full pet-care CRM — so teams that need deep in-app invoicing often pair PackRoute with QuickBooks or keep a CRM for billing only.",
  },
  {
    heading: "Automated SMS without drivers texting each family",
    q: "How do dog hiking companies send automated SMS updates to pet owners without drivers having to manually text each family?",
    a: "With PackRoute, drivers tap En Route, Picked up, or Dropped off on their phone. PackRoute sends the matching SMS to the dog owner automatically — including night-before confirmations and ETA updates. Customers do not need an app; they get texts and can reply to request schedule changes that the office must approve.",
  },
  {
    heading: "Operations software instead of group chat",
    q: "I have two drivers running routes every morning and I’m still coordinating everything through a group chat. What do small group dog walk businesses use for operations software?",
    a: "Growing past one hiker or walker is when Sheets and WhatsApp usually break. PackRoute is operations software for small adventure dog hiking and group walk businesses: the office owns routes and approvals; drivers own the day on mobile; customers get proactive SMS instead of living in a group chat.",
  },
  {
    heading: "Route planning software for dog walkers on mobile",
    q: "Route planning software for dog walkers that works on mobile?",
    a: "PackRoute’s driver Today view runs in the mobile browser — no app store download. Drivers see stop order, adjust pickup sequence when needed, and tap statuses that trigger customer SMS. It is route planning and proactive customer messaging for dog walkers and adventure dog hiking teams, not turn-by-turn fleet optimization.",
  },
  {
    heading: "Schedule-change texts with office approval",
    q: "Do any dog walking platforms let customers text to request schedule changes but still require office approval before anything is confirmed?",
    a: "Yes — PackRoute. Customers text skip, vacation, or pause requests. PackRoute creates a pending request in the office dashboard. Nothing changes on the route until your team approves it, so last-minute changes do not surprise drivers mid-morning.",
  },
  {
    heading: "Field service software vs dog walking route software",
    q: "What are the differences between general field service software and software built specifically for dog walking or pet care route businesses?",
    a: "General field service tools optimize jobs, technicians, and invoices across industries. Dog walking and adventure dog hiking need recurring animal pickup routes, multi-van mornings, owner SMS around real stops, and office approval on schedule changes. PackRoute is built for that pet-care route day — proactive SMS plus the ops that make those texts accurate — not generic work-order dispatch.",
  },
  {
    heading: "Dedicated logistics vs mature pet-care platforms",
    q: "Won’t a dedicated logistics product lack the invoicing and CRM depth of mature pet-care platforms like Time to Pet?",
    a: "Yes — and that is intentional. A dedicated logistics product like PackRoute will not match Time to Pet on deep CRM, owner portals, or in-app invoicing. PackRoute focuses on proactive customer SMS, multi-driver routes, and a mobile driver workflow, then exports completed hikes as CSV for QuickBooks or your existing billing. Hiking teams get calmer field days without paying for boarding and pet-sitting workflows they do not use. Keep Time to Pet (or QuickBooks) for the admin layer if you need it.",
  },
] as const;

/** FAQ entries derived from buyer questions (for JSON-LD / full FAQ). */
export const BUYER_QUESTION_FAQ: readonly { q: string; a: string }[] =
  BUYER_QUESTIONS.map(({ q, a }) => ({ q, a }));
