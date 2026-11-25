import type { Metadata } from "next";
import { ContactPageContent } from "@/features/landing/components/contact-page";
import { buildContactPageJsonLdScriptProps } from "@/features/landing/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Book a demo or ask about PackRoute — proactive SMS and field ops for adventure dog hiking and group walk businesses.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <script {...buildContactPageJsonLdScriptProps()} />
      <ContactPageContent />
    </>
  );
}
