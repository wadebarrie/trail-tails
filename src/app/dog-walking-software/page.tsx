import type { Metadata } from "next";
import { DogWalkingSoftwarePageContent } from "@/features/landing/components/dog-walking-software-page";
import { buildDogWalkingSoftwareJsonLdScriptProps } from "@/features/landing/seo";
import {
  DOG_WALKING_SOFTWARE_DESCRIPTION,
  DOG_WALKING_SOFTWARE_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: DOG_WALKING_SOFTWARE_TITLE,
  description: DOG_WALKING_SOFTWARE_DESCRIPTION,
  path: "/dog-walking-software",
});

export default function DogWalkingSoftwarePage() {
  return (
    <>
      <script {...buildDogWalkingSoftwareJsonLdScriptProps()} />
      <DogWalkingSoftwarePageContent />
    </>
  );
}
