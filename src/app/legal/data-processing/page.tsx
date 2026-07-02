import type { Metadata } from "next";
import { LegalPageShell } from "@/features/legal/components/legal-page-shell";
import { dataProcessingDocument } from "@/features/legal/content/data-processing";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: dataProcessingDocument.title,
  description: dataProcessingDocument.description,
  alternates: { canonical: `${getSiteUrl()}/legal/data-processing` },
};

export default function DataProcessingPage() {
  return <LegalPageShell document={dataProcessingDocument} />;
}
