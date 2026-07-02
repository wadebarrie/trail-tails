import Link from "next/link";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import { ContactForm } from "@/features/landing/components/contact-form";
import { FooterContactEmail } from "@/features/landing/components/footer-contact-email";
import { LandingHeader } from "@/features/landing/components/landing-header";
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

      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-semibold text-[var(--color-trail-800)]">PackRoute</p>
            <p className="mt-1 text-sm text-stone-500">
              Software for adventure dog hiking teams.
            </p>
            <FooterContactEmail />
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center gap-4 text-sm text-stone-600"
          >
            <Link href="/#how-it-works" className="hover:text-[var(--color-trail-700)]">
              How it works
            </Link>
            <Link href="/#features" className="hover:text-[var(--color-trail-700)]">
              Features
            </Link>
            <Link href="/login" className="hover:text-[var(--color-trail-700)]">
              Login
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
