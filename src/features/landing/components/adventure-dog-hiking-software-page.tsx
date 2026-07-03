import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { ADVENTURE_DOG_HIKING_SOFTWARE_TITLE } from "@/lib/seo/metadata";

const CAPABILITIES = [
  {
    title: "Group hikes and pack walks",
    body: "Schedule recurring dogs across morning and afternoon routes. Handle as-needed bookings without breaking your long-term plan.",
  },
  {
    title: "Multi-driver pickup coordination",
    body: "Assign drivers, split routes, and adjust stop order for today or tomorrow — built for days when several vans hit the road.",
  },
  {
    title: "Proactive customer SMS",
    body: "Night-before reminders, en-route ETAs, and pickup or drop-off confirmations fire automatically from driver status taps.",
  },
  {
    title: "Schedule changes with office control",
    body: "Customers can text skip or reschedule requests. Nothing changes until your team confirms — no surprise gaps on the route.",
  },
];

export function AdventureDogHikingSoftwarePageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            Adventure dog hiking software
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            {ADVENTURE_DOG_HIKING_SOFTWARE_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            PackRoute is operations software for adventure dog hiking teams —
            the kind that run pickup routes, group hikes, and pack walks with
            multiple drivers and dozens to hundreds of active dogs.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            Not a consumer marketplace or in-home pet sitting app. Built for
            field days where the office plans the route and drivers execute on
            the road.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Run group dog walking operations without spreadsheet chaos
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              For operators with one to ten drivers who need adventure dog
              hiking software that matches how pickup routes and group hikes
              actually run — not generic pet care tools.
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
              See how PackRoute fits your team
            </h2>
            <p className="mt-4 text-stone-600">
              Explore the full product tour, compare route planning features, or
              read common questions from adventure dog hiking operators.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Product overview
              </Link>
              <Link
                href="/dog-walking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Dog walking route planner
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
            <h2 className="text-3xl font-semibold">Book a demo</h2>
            <p className="mt-4 text-lg text-white/80">
              See PackRoute with your routes in mind — we&apos;ll reply within a
              business day.
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
          { href: "/dog-walking-software", label: "Dog walking software" },
          { href: "/contact", label: "Contact" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
