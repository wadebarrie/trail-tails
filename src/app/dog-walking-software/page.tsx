import type { Metadata } from "next";
import { DogWalkingSoftwarePageContent } from "@/features/landing/components/dog-walking-software-page";
import { buildDogWalkingSoftwareJsonLdScriptProps } from "@/features/landing/seo";
import {
  DOG_WALKING_SOFTWARE_DESCRIPTION,
  DOG_WALKING_SOFTWARE_TITLE,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `${DOG_WALKING_SOFTWARE_TITLE} — ${SITE_NAME}`;
const canonical = `${getSiteUrl()}/dog-walking-software`;

export const metadata: Metadata = {
  title,
  description: DOG_WALKING_SOFTWARE_DESCRIPTION,
  alternates: { canonical },
  openGraph: {
    url: canonical,
    title,
    description: DOG_WALKING_SOFTWARE_DESCRIPTION,
  },
  twitter: {
    title,
    description: DOG_WALKING_SOFTWARE_DESCRIPTION,
  },
};

export default function DogWalkingSoftwarePage() {
  return (
    <>
      <script {...buildDogWalkingSoftwareJsonLdScriptProps()} />
      <DogWalkingSoftwarePageContent />
    </>
  );
}
