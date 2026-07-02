import { LandingHeader } from "@/features/landing/components/landing-header";
import { LegalDisclaimer } from "@/features/legal/components/legal-disclaimer";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import type { LegalDocumentContent } from "@/features/legal/types";
import { LEGAL_LAST_UPDATED } from "@/lib/legal/constants";

export function LegalPageShell({ document }: { document: LegalDocumentContent }) {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm text-stone-500">Last updated: {LEGAL_LAST_UPDATED}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-trail-800)] sm:text-4xl">
          {document.title}
        </h1>
        <LegalDisclaimer />
        <div className="mt-10">
          <LegalDocument document={document} />
        </div>
        <p className="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-500">
          These terms and disclosures may be updated from time to time. When we
          make material changes, we will update the &ldquo;Last updated&rdquo;
          date at the top of this page.
        </p>
      </main>

      <MarketingFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact" },
        ]}
      />
    </div>
  );
}
