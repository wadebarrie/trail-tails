import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/components/landing-page";
import { LandingJsonLd } from "@/features/landing/components/landing-json-ld";
import { isSelfSignupEnabled } from "@/features/platform/settings";
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: HOME_TITLE,
  absoluteTitle: HOME_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const showStartTrial = await isSelfSignupEnabled();

  return (
    <>
      <LandingJsonLd />
      <LandingPage showStartTrial={showStartTrial} />
    </>
  );
}
