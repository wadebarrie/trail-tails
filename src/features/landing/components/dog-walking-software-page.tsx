import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { FooterContactEmail } from "@/features/landing/components/footer-contact-email";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { DOG_WALKING_SOFTWARE_TITLE } from "@/lib/seo/metadata";

const CAPABILITIES = [
  {
    title: "Dog walking route planner",
    body: "Build pickup routes, set stop order, and adjust today or tomorrow without losing your long-term schedule.",
  },
  {
    title: "Scheduling for group hikes and pack walks",
    body: "Morning and afternoon routes, recurring dogs, as-needed bookings, and driver assignment — built for multi-driver days.",
  },
  {
    title: "Driver workflow on the road",
    body: "Drivers open Today, see what to do next, and tap through stops. No app store — works in the mobile browser.",
  },
  {
    title: "Customer updates without extra admin",
    body: "SMS for reminders, ETAs, and pickup or drop-off confirmations. Schedule requests go to the office first.",
  },
];

export function DogWalkingSoftwarePageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            Dog walking software
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            {DOG_WALKING_SOFTWARE_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            PackRoute helps small dog hiking teams manage pickup routes, group
            hikes, driver workflows, and customer communication — without
            spreadsheet chaos or constant &ldquo;where is my dog?&rdquo; texts.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            Built for adventure dog hiking teams, pack walks, and group dog
            walking routes — not generic pet sitting or consumer marketplaces.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Route planning and customer updates for adventure dog hiking
              businesses
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              For operators with one to ten drivers and roughly twenty to three
              hundred active dogs who need dog walking management software that
              matches how field days actually run.
            </p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {CAPABILITIES.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-stone-200 bg-[var(--color-trail-50)] p-5"
                >
                  <h3 className="font-semibold text-[var(--color-trail-800)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              A calmer alternative to spreadsheets and group chats
            </h2>
            <p className="mt-4 text-stone-600">
              The office owns the schedule. The driver owns the route. Customers
              get trustworthy updates — not surveillance-heavy tracking or
              enterprise fleet software.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                See the full product tour
              </Link>
              <Link
                href="/#faq"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-trail-700)] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold">See PackRoute in action</h2>
            <p className="mt-4 text-lg text-white/80">
              Book a demo or ask a question — we&apos;ll reply within a business
              day.
            </p>
            <div className="mt-8">
              <CtaButtons variant="dark" align="center" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-semibold text-[var(--color-trail-800)]">
              PackRoute
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Dog walking route planning for adventure hike teams.
            </p>
            <FooterContactEmail />
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center gap-4 text-sm text-stone-600"
          >
            <Link href="/" className="hover:text-[var(--color-trail-700)]">
              Home
            </Link>
            <Link href="/contact" className="hover:text-[var(--color-trail-700)]">
              Contact
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
