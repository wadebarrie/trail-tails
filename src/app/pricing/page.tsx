import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingPageContent } from "@/features/landing/components/pricing-page";
import { resolvePricingDisplayCurrency } from "@/features/landing/pricing-currency";
import { buildPricingJsonLdScriptProps } from "@/features/landing/seo";
import { isSelfSignupEnabled } from "@/features/platform/settings";
import {
  PRICING_DESCRIPTION,
  PRICING_TITLE,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

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

type PricingPageProps = {
  searchParams: Promise<{ currency?: string }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [showStartTrial, requestHeaders, params] = await Promise.all([
    isSelfSignupEnabled(),
    headers(),
    searchParams,
  ]);
  const currency = resolvePricingDisplayCurrency(
    requestHeaders,
    params.currency
  );

  return (
    <>
      <script {...buildPricingJsonLdScriptProps(currency)} />
      <PricingPageContent
        showStartTrial={showStartTrial}
        currency={currency}
      />
    </>
  );
}
