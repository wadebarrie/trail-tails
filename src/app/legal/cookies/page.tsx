import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { cookiesDocument } from "@/features/legal/content/cookies";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: cookiesDocument.title,
  description: cookiesDocument.description,
  path: "/legal/cookies",
});

export default function CookiesPage() {
  return <LegalPageShell document={cookiesDocument} />;
}
