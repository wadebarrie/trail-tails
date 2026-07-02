import type { Metadata } from "next";
import { ContactPageContent } from "@/features/landing/components/contact-page";
import { SITE_NAME } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `Contact — ${SITE_NAME}`;
const description =
  "Book a demo, request early access, or ask a question about PackRoute for your dog hiking team.";

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
  return <ContactPageContent />;
}
