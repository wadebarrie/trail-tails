import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { dataProcessingDocument } from "@/features/legal/content/data-processing";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: dataProcessingDocument.title,
  description: dataProcessingDocument.description,
  path: "/legal/data-processing",
});

export default function DataProcessingPage() {
  return <LegalPageShell document={dataProcessingDocument} />;
}
