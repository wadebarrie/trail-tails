import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { DOG_WALKING_SOFTWARE_TITLE } from "@/lib/seo/metadata";

const CAPABILITIES = [
  {
    title: "Replace spreadsheets for route planning",
    body: "Build pickup routes, set stop order, and adjust today or tomorrow without rebuilding a Google Sheet every morning.",
  },
  {
    title: "Multi-driver mornings that stay calm",
    body: "Morning and afternoon routes, recurring dogs, as-needed bookings, and driver assignment — built for days when several vans hit the road.",
  },
  {
    title: "Driver workflow on the road",
    body: "Drivers open Today, see what to do next, and tap through stops. Route planning software for dog walkers that works in the mobile browser — no app store.",
  },
  {
    title: "Automated SMS ETAs — not WhatsApp chaos",
    body: "Reminders, en-route ETAs, and pickup or drop-off confirmations send from driver status taps. Schedule requests go to the office first.",
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
            Best way to replace spreadsheets for dog walk route planning:
            PackRoute helps small dog hiking teams manage multi-driver pickup
            routes, driver workflows, and automated customer SMS ETAs — without
            Google Sheets, WhatsApp group chats, or constant &ldquo;where is my
            dog?&rdquo; calls.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            Built for adventure dog hiking teams, pack walks, and group dog
            walking routes — not generic pet sitting, consumer marketplaces, or
            a full CRM/invoicing suite.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Route planning and ETA notifications for adventure dog hiking
              businesses
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              For operators growing from one hiker or walker to a few vans —
              roughly twenty to three hundred active dogs — who need dog walking
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

        <section className="border-b border-stone-200/80 bg-[var(--color-trail-50)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Ops software vs CRM and invoicing
            </h2>
            <p className="mt-4 text-stone-600">
              Dedicated logistics tools sometimes get framed as light on business
              administration. PackRoute is clear about the tradeoff: we own the
              field day — routes, drivers, and customer SMS — and export
              completed hikes as CSV for QuickBooks or your existing billing
              process. If you need deep owner CRM, photo visit reports, or
              in-app invoicing, keep Time to Pet (or similar) for that layer and
              use PackRoute for pickup-route operations.
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
              get trustworthy SMS updates — not surveillance-heavy tracking or
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

      <MarketingFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
