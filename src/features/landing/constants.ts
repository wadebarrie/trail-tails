import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export const DEMO_MAILTO = `mailto:${SITE_CONTACT_EMAIL}?subject=PackRoute%20demo%20request`;

export const WAITLIST_MAILTO = `mailto:${SITE_CONTACT_EMAIL}?subject=PackRoute%20early%20access`;

export { LANDING_FAQ } from "@/lib/seo/metadata";

export const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#sms", label: "SMS" },
  { href: "#faq", label: "FAQ" },
] as const;
