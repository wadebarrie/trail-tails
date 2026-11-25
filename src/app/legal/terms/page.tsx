import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { termsDocument } from "@/features/legal/content/terms";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: termsDocument.title,
  description: termsDocument.description,
  path: "/legal/terms",
});

export default function TermsPage() {
  return <LegalPageShell document={termsDocument} />;
}
