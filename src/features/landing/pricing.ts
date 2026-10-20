/**
 * Public pricing — capacity by hikers/walkers + dogs; all features on every plan.
 *
 * Margin note (planning): customer SMS is ~$1 / active dog / month at typical
 * 2 hike-days/week. Dog caps keep SMS COGS near ~20–25% of list price.
 */

export const PRICING_CURRENCY = "USD";

export type PricingTierId = "one_hiker" | "two_hikers" | "three_plus";

export type PricingTier = {
  id: PricingTierId;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceLabel: string;
  /** Capacity line shown under the tier name (hikers/walkers on the road). */
  hikers: string;
  dogs: string;
  highlight?: boolean;
};

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "one_hiker",
    name: "One driver",
    priceMonthly: 99,
    priceLabel: "$99/month",
    hikers: "1 driver on the road",
    dogs: "Up to 20 active dogs a week",
  },
  {
    id: "two_hikers",
    name: "Two drivers",
    badge: "Most common",
    priceMonthly: 179,
    priceLabel: "$179/month",
    hikers: "2 drivers",
    dogs: "Up to 40 active dogs a week",
    highlight: true,
  },
  {
    id: "three_plus",
    name: "Three+ drivers",
    priceMonthly: 299,
    priceLabel: "$299/month",
    hikers: "3+ drivers, multi-route mornings",
    dogs: "Up to 70 active dogs a week",
  },
] as const;

/** Shared on every tier — capacity is what changes. */
export const PRICING_INCLUDED_FEATURES = [
  "Automated customer SMS — reminders, ETAs, pickup and drop-off updates",
  "Pickup route planning and driver Today view",
  "Unlimited office logins",
  "Schedule-change texts with office approval",
  "Completed-hike CSV export for QuickBooks, Xero, or your billing process",
  "Onboarding screenshare + email support",
] as const;

export type PricingAddon = {
  id: "quickbooks" | "xero";
  name: string;
  summary: string;
  feeLabel: string;
};

/** Paid integrations — offered now; built when a customer requests them. */
export const PRICING_ADDONS: readonly PricingAddon[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    summary:
      "Push completed hike charges into QuickBooks so you can invoice without re-typing the CSV.",
    feeLabel: "Paid add-on — quoted when you request it",
  },
  {
    id: "xero",
    name: "Xero",
    summary:
      "Same completed-hike sync for teams that bill in Xero (popular with Canadian operators).",
    feeLabel: "Paid add-on — quoted when you request it",
  },
] as const;

export const PRICING_FAQ = [
  {
    q: "Is the first month really free?",
    a: "Yes. After a short demo we set up your company and you run your first month on us — no card required to start. When the month ends, pick a tier or pause. Your data remains either way.",
  },
  {
    q: "What's different between tiers?",
    a: "Capacity only — how many drivers you have on the road and how many active dogs you run in a week. Every feature, unlimited office logins, onboarding screenshare, and support are the same on every tier. Customer SMS is included within your dog cap. PackRoute is for both dog walking and adventure hiking teams.",
  },
  {
    q: "What counts as a driver?",
    a: "Anyone who runs a pickup route day. Walking companies and hiking companies both use the Driver role and Driver Today view — whether you call them walkers or hikers on the road. Office-only logins do not count toward the capacity limit.",
  },
  {
    q: "What if we have more than 70 dogs?",
    a: "Contact us for a custom plan. Larger fleets need a price that still covers automated customer SMS at volume.",
  },
  {
    q: "Do you handle customer invoicing and payments?",
    a: "No. PackRoute is built around proactive customer SMS, with routes and drivers to make those texts accurate. Every plan includes completed-hike CSV export so you can bill in QuickBooks, Xero, or your own process. Live QuickBooks Online and Xero sync are optional paid add-ons — ask us when you are ready and we will enable them for your company.",
  },
  {
    q: "Do you integrate with QuickBooks or Xero?",
    a: "Yes as paid add-ons. CSV export is included on every plan today. Direct QuickBooks Online and Xero sync are available for a fee when you request them — we build and turn on the connection for your company rather than shipping unused integrations to everyone.",
  },
  {
    q: "Is there a setup fee?",
    a: "No for the core product. Every plan includes an onboarding screenshare so we can import your roster and get a real route day running. Accounting add-ons are quoted separately when you request them.",
  },
  {
    q: "Can I bring my data in?",
    a: "Yes. CSV import for customers and dogs, or we will help you move a spreadsheet during onboarding.",
  },
  {
    q: "How does customer SMS work?",
    a: "Texts send from PackRoute’s business number to Canada and US mobiles. Your company is responsible for consent. Customers text STOP REMINDERS to opt out of night-before reminders and START REMINDERS to opt back in. ETA and pickup texts still send while they are scheduled. SMS is included up to your active-dog cap — no per-text fee inside that cap.",
  },
  {
    q: "Can I move tiers later?",
    a: "Anytime, up or down — same data, same dogs, no migration. Beta subscriptions are billed in Stripe at the price on this page. Changing tiers updates what you pay going forward. Email us if you need the current period adjusted.",
  },
  {
    q: "Annual discount?",
    a: "Yes — pay for 10 months, get 12.",
  },
  {
    q: "What does “beta pricing” mean?",
    a: "We are in open beta. You may hit an occasional rough edge; tell us and we will prioritize a fix. In return, these are limited-time beta prices — subscribe during beta and your rate stays locked for as long as you remain a customer. Prices increase when we leave beta.",
  },
] as const;
