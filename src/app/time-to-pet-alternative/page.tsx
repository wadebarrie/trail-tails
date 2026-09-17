import type { Metadata } from "next";
import { TimeToPetAlternativePageContent } from "@/features/landing/components/time-to-pet-alternative-page";
import { buildTimeToPetAlternativeJsonLdScriptProps } from "@/features/landing/seo";
import {
  SITE_NAME,
  TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  TIME_TO_PET_ALTERNATIVE_TITLE,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `${TIME_TO_PET_ALTERNATIVE_TITLE} — ${SITE_NAME}`;
const canonical = `${getSiteUrl()}/time-to-pet-alternative`;

export const metadata: Metadata = {
  title,
  description: TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  keywords: [
    "time to pet alternative",
    "time to pet alternatives",
    "alternatives to time to pet",
    "leashtime alternative",
    "pet sitter plus alternative",
    "gingr alternative",
    "dog walking software",
    "adventure dog hiking software",
  ],
  alternates: { canonical },
  openGraph: {
    url: canonical,
    title,
    description: TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  },
  twitter: {
    title,
    description: TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  },
};

export default function TimeToPetAlternativePage() {
  return (
    <>
      <script {...buildTimeToPetAlternativeJsonLdScriptProps()} />
      <TimeToPetAlternativePageContent />
    </>
  );
}
