import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { privacyDocument } from "@/features/legal/content/privacy";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: privacyDocument.title,
  description: privacyDocument.description,
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return <LegalPageShell document={privacyDocument} />;
}
