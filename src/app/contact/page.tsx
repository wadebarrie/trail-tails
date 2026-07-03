import type { Metadata } from "next";
import { ContactPageContent } from "@/features/landing/components/contact-page";
import { buildContactPageJsonLdScriptProps } from "@/features/landing/seo";
import { SITE_NAME } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `Contact — ${SITE_NAME}`;
const description =
  "Book a demo or ask about PackRoute — dog walking route planning software for adventure dog hiking and group walk businesses.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${getSiteUrl()}/contact`,
  },
  openGraph: {
    url: `${getSiteUrl()}/contact`,
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function ContactPage() {
  return (
    <>
      <script {...buildContactPageJsonLdScriptProps()} />
      <ContactPageContent />
    </>
  );
}
