/** Public pricing — capacity by hikers + dogs; all features on every plan. */

export const PRICING_CURRENCY = "USD";

export const PRICING_BETA_LOCK_DATE = "31 December 2026";

export type PricingTierId = "one_hiker" | "two_hikers" | "three_plus";

export type PricingTier = {
  id: PricingTierId;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceLabel: string;
  hikers: string;
  dogs: string;
  highlight?: boolean;
};

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "one_hiker",
    name: "One hiker",
    priceMonthly: 29,
    priceLabel: "$29/month",
    hikers: "1 hiker on the road",
    dogs: "Up to 40 active dogs a week",
  },
  {
    id: "two_hikers",
    name: "Two hikers",
    badge: "Most common",
    priceMonthly: 49,
    priceLabel: "$49/month",
    hikers: "2 hikers",
    dogs: "Up to 120 active dogs a week",
    highlight: true,
  },
  {
    id: "three_plus",
    name: "Three+ hikers",
    priceMonthly: 79,
    priceLabel: "$79/month",
    hikers: "3+ hikers, multi-route mornings",
    dogs: "Unlimited dogs",
  },
] as const;

/** Shared on every tier — capacity is what changes. */
export const PRICING_INCLUDED_FEATURES = [
  "Unlimited office logins",
  "Pickup route planning and hiker Today view",
  "Automated customer SMS — reminders, ETAs, pickup and drop-off updates",
  "Schedule-change texts with office approval",
  "Completed-hike CSV export for QuickBooks or your billing process",
  "Onboarding screenshare + email support",
] as const;

export const PRICING_FAQ = [
  {
    q: "Is the first month really free?",
    a: "Yes. After a short demo we set up your company and you run your first month on us — no card required to start the conversation. When the month ends, pick a tier or pause. Your data stays put either way.",
  },
  {
    q: "What's different between tiers?",
    a: "Capacity only — how many hikers you have on the road and how many active dogs you run in a week. Every feature, unlimited office logins, onboarding screenshare, and support are the same on every tier.",
  },
  {
    q: "What counts as a hiker?",
    a: "Anyone who runs a pickup route day in PackRoute — your field drivers / handlers. Office-only logins do not count toward the hiker limit.",
  },
  {
    q: "Do you handle customer invoicing and payments?",
    a: "No. PackRoute is operations software for routes, hikers, and SMS. You export completed hikes as CSV and bill in QuickBooks or your own process. That keeps the product focused on the field day.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. Every plan includes an onboarding screenshare so we can import your roster and get a real route day running.",
  },
  {
    q: "Can I bring my data in?",
    a: "Yes. CSV import for customers and dogs, or we'll help you move a spreadsheet during onboarding.",
  },
  {
    q: "Can I move tiers later?",
    a: "Anytime, up or down — same data, same dogs, no migration. We'll prorate when billing is live.",
  },
  {
    q: "Annual discount?",
    a: "Yes — pay for 10 months, get 12.",
  },
  {
    q: "What does “beta pricing” mean?",
    a: `We're in open beta. You'll find the odd rough edge, and you'll get it fixed the week you tell us about it. In exchange these are beta prices — subscribe before ${PRICING_BETA_LOCK_DATE} and your rate stays put for as long as you're with us. Prices go up when we launch properly next year.`,
  },
] as const;
