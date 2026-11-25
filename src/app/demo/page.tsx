import type { Metadata } from "next";
import { DemoPageContent } from "@/features/landing/components/demo-page";
import { SITE_NAME } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/site-url";

const title = `Book a demo — ${SITE_NAME}`;
const description =
  "Request a PackRoute demo for your dog walking or adventure hiking team. We reply within a business day.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${getSiteUrl()}/demo`,
  },
  openGraph: {
    url: `${getSiteUrl()}/demo`,
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function DemoPage() {
  return <DemoPageContent />;
}
