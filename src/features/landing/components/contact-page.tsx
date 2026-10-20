import Link from "next/link";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import { ContactForm } from "@/features/landing/components/contact-form";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export function ContactPageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
          Contact
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)] sm:text-4xl">
          Get in touch
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Book a demo, ask about early access, or send a question. We&apos;ll
          reply from{" "}
          <span className="font-medium text-stone-800">{SITE_CONTACT_EMAIL}</span>
          .
        </p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-stone-600">
          <h2 className="text-lg font-semibold text-stone-900">
            What connects, and how data is handled
          </h2>
          <p>
            Every plan includes CSV export for billing. QuickBooks Online and
            Xero sync are optional paid add-ons — we turn them on for your
            company when you ask. There is no separate status page; email{" "}
            {SITE_CONTACT_EMAIL} if the product is down.
          </p>
          <p>
            Office admins sign in with a password and an authenticator app.
            Each company only sees its own customers, dogs, and routes. Texts
            go out through Twilio from PackRoute&apos;s business number.
          </p>
        </section>

        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>

        <ContactEmailFallback className="mt-6" />

        <p className="mt-8 text-sm text-stone-500">
          Already on PackRoute?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
          >
            Team login
          </Link>
        </p>
      </main>

      <MarketingFooter />
    </div>
  );
}
