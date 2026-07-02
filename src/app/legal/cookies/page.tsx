import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { cookiesDocument } from "@/features/legal/content/cookies";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: cookiesDocument.title,
  description: cookiesDocument.description,
  alternates: { canonical: `${getSiteUrl()}/legal/cookies` },
};

export default function CookiesPage() {
  return <LegalPageShell document={cookiesDocument} />;
}
