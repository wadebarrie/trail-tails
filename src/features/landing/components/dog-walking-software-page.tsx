import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { BUYER_QUESTIONS } from "@/features/landing/buyer-questions";
import { DOG_WALKING_SOFTWARE_TITLE } from "@/lib/seo/metadata";

const CAPABILITIES = [
  {
    title: "Hours back for the office",
    body: "Stop answering “where's my dog?” and mediating WhatsApp. Reminders, ETAs, and pickup updates go out automatically from driver status taps.",
  },
  {
    title: "Customers who feel taken care of",
    body: "Families get clear texts without chasing your team. Schedule requests still wait for office approval — no surprise route changes.",
  },
  {
    title: "Calm multi-driver mornings",
    body: "Morning and afternoon routes, recurring dogs, as-needed bookings, and driver assignment — without rebuilding a Google Sheet every morning.",
  },
  {
    title: "Drivers who just run the day",
    body: "Drivers open Today, see what to do next, and tap through stops. Those taps trigger customer updates — mobile browser, no app store.",
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
            Stop living in group chats. PackRoute texts owners for you —
            night-before reminders, ETAs, and pickup updates — so your office
            gets time back and families always know what&apos;s going on. Built
            for dog walking and adventure hiking teams.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            A lighter Canadian alternative to broad pet-care suites — focused on
            the people running the day, not a consumer marketplace or boarding
            system.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Save time in the office. Keep customers happy.
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              For operators growing from one driver to a few vans — roughly
              twenty to three hundred active dogs — who need dog walking
              management software that matches how field days actually run.
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

        <section className="border-b border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Common questions from dog hiking operators
            </h2>
            <p className="mt-4 text-stone-600">
              Straight answers to how teams replace spreadsheets and WhatsApp,
              automate owner SMS, and keep office control on schedule changes.
            </p>
            <dl className="mt-10 space-y-8">
              {BUYER_QUESTIONS.map((item) => (
                <div key={item.q}>
                  <dt className="text-lg font-semibold text-[var(--color-trail-800)]">
                    {item.heading}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-stone-200/80 bg-[var(--color-trail-50)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Ops and SMS first — billing that follows the hikes
            </h2>
            <p className="mt-4 text-stone-600">
              PackRoute owns proactive customer SMS, multi-driver routes, group
              hike time slots, and the driver phone workflow. Completed hikes
              export as CSV for QuickBooks, Xero, or e-Transfer today, and
              built-in CAD invoicing is on the roadmap. Hiking and walking teams
              get a lighter Canadian product without paying for boarding and
              pet-sitting workflows they do not use.
            </p>
            <p className="mt-4 text-sm text-stone-500">
              See also our{" "}
              <Link
                href="/time-to-pet-alternative"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Time to Pet alternative
              </Link>{" "}
              comparison.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              A calmer alternative to spreadsheets and group chats
            </h2>
            <p className="mt-4 text-stone-600">
              The office owns the schedule. The driver owns the route. Customers
              get trustworthy SMS updates without anyone manually texting each
              stop — not surveillance-heavy tracking or enterprise fleet software.
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
              <Link
                href="/adventure-dog-hiking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Adventure dog hiking software
              </Link>
              <Link
                href="/time-to-pet-alternative"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Time to Pet alternative
              </Link>
              <Link
                href="/barkbus-alternative"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                BarkBus alternative
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-trail-700)] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold">
              Get hours back every week
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Book a demo — we&apos;ll reply within a business day.
            </p>
            <div className="mt-8">
              <CtaButtons variant="dark" align="center" />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
