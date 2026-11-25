import type { Metadata } from "next";
import { DemoPageContent } from "@/features/landing/components/demo-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Book a demo",
  description:
    "Request a PackRoute demo for your dog walking or adventure hiking team. We reply within a business day.",
  path: "/demo",
});

export default function DemoPage() {
  return <DemoPageContent />;
}
