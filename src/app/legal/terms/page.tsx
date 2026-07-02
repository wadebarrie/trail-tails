import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { termsDocument } from "@/features/legal/content/terms";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: termsDocument.title,
  description: termsDocument.description,
  alternates: { canonical: `${getSiteUrl()}/legal/terms` },
};

export default function TermsPage() {
  return <LegalPageShell document={termsDocument} />;
}
