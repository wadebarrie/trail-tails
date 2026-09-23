import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/components/landing-page";
import { LandingJsonLd } from "@/features/landing/components/landing-json-ld";
import { isSelfSignupEnabled } from "@/features/platform/settings";
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    url: getSiteUrl(),
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function HomePage() {
  const showStartTrial = await isSelfSignupEnabled();

  return (
    <>
      <LandingJsonLd />
      <LandingPage showStartTrial={showStartTrial} />
    </>
  );
}
