import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { TIME_TO_PET_ALTERNATIVE_TITLE } from "@/lib/seo/metadata";

const FIT_POINTS = [
  {
    title: "Built for pickup routes and group hikes",
    body: "Morning and afternoon routes, recurring dogs, multi-driver days, and stop order you control — not visit calendars designed for in-home pet sitting.",
  },
  {
    title: "Driver workflow that answers “what next?”",
    body: "Drivers open Today in the mobile browser, tap En Route / Arrived / Picked up / Dropped off, and move through the route without a heavy app store install.",
  },
  {
    title: "Customer SMS without extra office work",
    body: "Night-before reminders, en-route ETAs, and pickup or drop-off confirmations fire from intentional driver actions. Schedule-change texts go to your office first.",
  },
  {
    title: "Calm ops for adventure dog hiking teams",
    body: "PackRoute is for operators with roughly one to ten hikers or walkers and dozens to hundreds of active dogs — not a consumer marketplace or facility boarding system.",
  },
];

const COMPARISON_ROWS = [
  {
    need: "Adventure dog hiking / pack walks with van pickups",
    fit: "PackRoute",
  },
  {
    need: "Multi-driver route days + automated SMS ETAs (replace Sheets / WhatsApp)",
    fit: "PackRoute",
  },
  {
    need: "Deep CRM, owner portals, and in-app invoicing / payments",
    fit: "Time to Pet and similar all-in-one pet care platforms (or keep them alongside PackRoute for billing)",
  },
  {
    need: "Broad pet sitting, daycare, boarding, or photo visit reports",
    fit: "Time to Pet, Pet Sitter Plus, Gingr, Precise Petcare, Scout, and similar",
  },
  {
    need: "Pack school vans with owner portal, AI booking, lock-screen widgets",
    fit: "BarkBus and similar pack-school tools — or compare PackRoute if hiking pickups and SMS are the core day",
  },
  {
    need: "Long walking routes with key management emphasis",
    fit: "LeashTime or similar walking specialists — compare against PackRoute if hiking pickups are your core day",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is PackRoute a Time to Pet alternative?",
    a: "For adventure dog hiking and group pack-walk companies, yes — PackRoute is a focused alternative for pickup route planning, multi-driver field days, and customer SMS. It is not a full pet-sitting, boarding, daycare, or deep CRM/invoicing suite.",
  },
  {
    q: "How is PackRoute different from Time to Pet?",
    a: "Time to Pet is strong for broad pet sitting, facility workflows, CRM, and in-app invoicing. PackRoute is built specifically for adventure dog hiking teams that run recurring pickup routes with drivers on the road and keep customers updated by automated SMS ETAs. Billing is CSV hike export into QuickBooks or your own process — not a replacement for a full pet-care ledger.",
  },
  {
    q: "Does PackRoute lack invoicing and CRM compared to Time to Pet?",
    a: "PackRoute does not try to match Time to Pet’s full business-administration depth. That is intentional: hiking teams get calmer route ops and SMS without paying for boarding and pet-sitting workflows. You still get completed-hike tracking and CSV export for invoicing. Keep Time to Pet (or QuickBooks) if you need owner CRM and payment collection in one pet-care suite.",
  },
  {
    q: "Who should keep using Time to Pet?",
    a: "Operators whose core work is pet sitting, daycare, boarding, photo-and-visit reporting, or deep in-app CRM and invoicing may be better served by Time to Pet. PackRoute is for hiking and pack-walk teams that need calmer multi-driver route operations.",
  },
];

export function TimeToPetAlternativePageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            Time to Pet alternative
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            {TIME_TO_PET_ALTERNATIVE_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            Searching for a Time to Pet alternative because your day is group
            hikes and pickup routes — not in-home visits? PackRoute is dog
            walking operations software built for adventure dog hiking teams
            replacing Google Sheets and WhatsApp with multi-driver routes and
            automated SMS ETAs.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            Time to Pet, Pet Sitter Plus, Gingr, LeashTime, Precise Petcare, and
            Scout serve many pet care businesses well — especially on CRM and
            invoicing. PackRoute is different on purpose: office-owned
            schedules, driver-owned routes, automatic customer SMS around real
            field stops, and CSV hike exports for the billing tool you already
            use.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Why hiking teams look beyond generic pet care software
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              All-in-one pet sitting platforms optimize for visits, staff check-ins,
              and client portals. Adventure dog hiking companies usually need
              something narrower and calmer for multi-stop pickup days.
            </p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {FIT_POINTS.map((item) => (
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
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Quick fit guide vs Time to Pet and other tools
            </h2>
            <p className="mt-4 text-stone-600">
              Honest positioning — choose the product that matches how your days
              actually run.
            </p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      If you mainly need
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Consider
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.need}>
                      <td className="px-4 py-3 text-stone-800">{row.need}</td>
                      <td className="px-4 py-3 text-stone-600">{row.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Time to Pet alternative FAQ
            </h2>
            <dl className="mt-8 space-y-6">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-[var(--color-trail-800)]">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Compare PackRoute for your operation
            </h2>
            <p className="mt-4 text-stone-600">
              See the full product tour, route planning details, or adventure dog
              hiking software overview — then book a demo if it fits.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Product overview
              </Link>
              <Link
                href="/barkbus-alternative"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                BarkBus alternative
              </Link>
              <Link
                href="/dog-walking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Dog walking software
              </Link>
              <Link
                href="/adventure-dog-hiking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Adventure dog hiking software
              </Link>
              <Link
                href="/#faq"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                FAQ
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-trail-700)] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold">Book a demo</h2>
            <p className="mt-4 text-lg text-white/80">
              Tell us how your routes run today — we&apos;ll reply within a
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
          { href: "/barkbus-alternative", label: "BarkBus alternative" },
          { href: "/contact", label: "Contact" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
