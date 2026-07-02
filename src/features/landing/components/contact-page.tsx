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
          reply to{" "}
          <span className="font-medium text-stone-800">{SITE_CONTACT_EMAIL}</span>
          .
        </p>

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

      <MarketingFooter
        extraLinks={[
          { href: "/#how-it-works", label: "How it works" },
          { href: "/#features", label: "Features" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
