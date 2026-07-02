import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { privacyDocument } from "@/features/legal/content/privacy";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: privacyDocument.title,
  description: privacyDocument.description,
  alternates: { canonical: `${getSiteUrl()}/legal/privacy` },
};

export default function PrivacyPage() {
  return <LegalPageShell document={privacyDocument} />;
}
