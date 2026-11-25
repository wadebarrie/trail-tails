import type { Metadata } from "next";
import { BarkBusAlternativePageContent } from "@/features/landing/components/barkbus-alternative-page";
import { buildBarkBusAlternativeJsonLdScriptProps } from "@/features/landing/seo";
import {
  BARKBUS_ALTERNATIVE_DESCRIPTION,
  BARKBUS_ALTERNATIVE_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: BARKBUS_ALTERNATIVE_TITLE,
  description: BARKBUS_ALTERNATIVE_DESCRIPTION,
  path: "/barkbus-alternative",
  keywords: [
    "barkbus alternative",
    "barkbus alternatives",
    "alternatives to barkbus",
    "barkbus vs packroute",
    "pack school software alternative",
    "dog walking van software",
    "adventure dog hiking software",
    "time to pet alternative",
  ],
});

export default function BarkBusAlternativePage() {
  return (
    <>
      <script {...buildBarkBusAlternativeJsonLdScriptProps()} />
      <BarkBusAlternativePageContent />
    </>
  );
}
