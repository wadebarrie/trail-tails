import type { Metadata } from "next";
import { AdventureDogHikingSoftwarePageContent } from "@/features/landing/components/adventure-dog-hiking-software-page";
import { isSelfSignupEnabled } from "@/features/platform/settings";
import { buildAdventureDogHikingSoftwareJsonLdScriptProps } from "@/features/landing/seo";
import {
  ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  ADVENTURE_DOG_HIKING_SOFTWARE_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: ADVENTURE_DOG_HIKING_SOFTWARE_TITLE,
  description: ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  path: "/adventure-dog-hiking-software",
});

export default async function AdventureDogHikingSoftwarePage() {
  const showStartTrial = await isSelfSignupEnabled();
  return (
    <>
      <script {...buildAdventureDogHikingSoftwareJsonLdScriptProps()} />
      <AdventureDogHikingSoftwarePageContent showStartTrial={showStartTrial} />
    </>
  );
}
