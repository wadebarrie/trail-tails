import Link from "next/link";
import { ContactForm } from "@/features/landing/components/contact-form";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export function DemoPageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
          Book a demo
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)] sm:text-4xl">
          See PackRoute on your routes
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Tell us about your walking or hiking team. We&apos;ll reply from{" "}
          <span className="font-medium text-stone-800">{SITE_CONTACT_EMAIL}</span>{" "}
          within a business day and set up a short walkthrough — including the
          Harbour Hikes demo company if you want to click around first.
        </p>

        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <ContactForm
            subject="PackRoute demo request"
            messagePlaceholder="How many drivers, roughly how many dogs, and what you use today (Time to Pet, Sheets, WhatsApp…)."
            submitLabel="Request a demo"
          />
        </div>

        <p className="mt-8 text-sm text-stone-500">
          Prefer email? Write{" "}
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}?subject=${encodeURIComponent("PackRoute demo request")}`}
            className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          . Already on PackRoute?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
          >
            Team login
          </Link>
          .
        </p>
      </main>

      <MarketingFooter />
    </div>
  );
}
