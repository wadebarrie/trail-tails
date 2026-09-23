import type { Metadata } from "next";
import { PricingPageContent } from "@/features/landing/components/pricing-page";
import { buildPricingJsonLdScriptProps } from "@/features/landing/seo";
import {
  PRICING_DESCRIPTION,
  PRICING_TITLE,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `${PRICING_TITLE} — ${SITE_NAME}`;
const canonical = `${getSiteUrl()}/pricing`;

export const metadata: Metadata = {
  title,
  description: PRICING_DESCRIPTION,
  alternates: { canonical },
  openGraph: {
    url: canonical,
    title,
    description: PRICING_DESCRIPTION,
  },
  twitter: {
    title,
    description: PRICING_DESCRIPTION,
  },
};

export default function PricingPage() {
  return (
    <>
      <script {...buildPricingJsonLdScriptProps()} />
      <PricingPageContent />
    </>
  );
}
