import type { Metadata } from "next";
import { PricingPageContent } from "@/features/landing/components/pricing-page";
import { buildPricingJsonLdScriptProps } from "@/features/landing/seo";
import { isSelfSignupEnabled } from "@/features/platform/settings";
import {
  PRICING_DESCRIPTION,
  PRICING_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  path: "/pricing",
});

export default async function PricingPage() {
  const showStartTrial = await isSelfSignupEnabled();

  return (
    <>
      <script {...buildPricingJsonLdScriptProps()} />
      <PricingPageContent showStartTrial={showStartTrial} />
    </>
  );
}
