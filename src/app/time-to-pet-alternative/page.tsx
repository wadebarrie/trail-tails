import type { Metadata } from "next";
import { TimeToPetAlternativePageContent } from "@/features/landing/components/time-to-pet-alternative-page";
import { buildTimeToPetAlternativeJsonLdScriptProps } from "@/features/landing/seo";
import {
  TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  TIME_TO_PET_ALTERNATIVE_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: TIME_TO_PET_ALTERNATIVE_TITLE,
  description: TIME_TO_PET_ALTERNATIVE_DESCRIPTION,
  path: "/time-to-pet-alternative",
  keywords: [
    "time to pet alternative",
    "time to pet alternatives",
    "alternatives to time to pet",
    "barkbus alternative",
    "leashtime alternative",
    "pet sitter plus alternative",
    "gingr alternative",
    "dog walking software",
    "adventure dog hiking software",
  ],
});

export default function TimeToPetAlternativePage() {
  return (
    <>
      <script {...buildTimeToPetAlternativeJsonLdScriptProps()} />
      <TimeToPetAlternativePageContent />
    </>
  );
}
