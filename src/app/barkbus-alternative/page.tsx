import type { Metadata } from "next";
import { BarkBusAlternativePageContent } from "@/features/landing/components/barkbus-alternative-page";
import { buildBarkBusAlternativeJsonLdScriptProps } from "@/features/landing/seo";
import {
  BARKBUS_ALTERNATIVE_DESCRIPTION,
  BARKBUS_ALTERNATIVE_TITLE,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `${BARKBUS_ALTERNATIVE_TITLE} — ${SITE_NAME}`;
const canonical = `${getSiteUrl()}/barkbus-alternative`;

export const metadata: Metadata = {
  title,
  description: BARKBUS_ALTERNATIVE_DESCRIPTION,
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
  alternates: { canonical },
  openGraph: {
    url: canonical,
    title,
    description: BARKBUS_ALTERNATIVE_DESCRIPTION,
  },
  twitter: {
    title,
    description: BARKBUS_ALTERNATIVE_DESCRIPTION,
  },
};

export default function BarkBusAlternativePage() {
  return (
    <>
      <script {...buildBarkBusAlternativeJsonLdScriptProps()} />
      <BarkBusAlternativePageContent />
    </>
  );
}
