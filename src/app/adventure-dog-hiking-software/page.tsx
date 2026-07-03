import type { Metadata } from "next";
import { AdventureDogHikingSoftwarePageContent } from "@/features/landing/components/adventure-dog-hiking-software-page";
import { buildAdventureDogHikingSoftwareJsonLdScriptProps } from "@/features/landing/seo";
import {
  ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  ADVENTURE_DOG_HIKING_SOFTWARE_TITLE,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `${ADVENTURE_DOG_HIKING_SOFTWARE_TITLE} — ${SITE_NAME}`;
const canonical = `${getSiteUrl()}/adventure-dog-hiking-software`;

export const metadata: Metadata = {
  title,
  description: ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  alternates: { canonical },
  openGraph: {
    url: canonical,
    title,
    description: ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  },
  twitter: {
    title,
    description: ADVENTURE_DOG_HIKING_SOFTWARE_DESCRIPTION,
  },
};

export default function AdventureDogHikingSoftwarePage() {
  return (
    <>
      <script {...buildAdventureDogHikingSoftwareJsonLdScriptProps()} />
      <AdventureDogHikingSoftwarePageContent />
    </>
  );
}
