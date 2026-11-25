import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { PRICING_TIERS } from "@/features/landing/pricing";
import { TIME_TO_PET_ALTERNATIVE_TITLE } from "@/lib/seo/metadata";

const FIT_POINTS = [
  {
    title: "Group hike time slots and pickup routes",
    body: "Morning and afternoon periods, recurring dogs, multi-driver days, and stop order you control — not visit calendars designed for in-home pet sitting.",
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
    title: "Canadian pricing for hiking teams",
    body: "Built in BC, priced in CAD, for walking and adventure hiking companies that want a lighter product than an all-in-one US pet-care suite.",
  },
];

const COMPARISON_ROWS = [
  {
    need: "Adventure dog hiking / pack walks with van pickups",
    fit: "PackRoute",
  },
  {
    need: "Group hike time slots + multi-driver route days",
    fit: "PackRoute",
  },
  {
    need: "Automated SMS ETAs (replace Sheets / WhatsApp)",
    fit: "PackRoute",
  },
  {
    need: "Clear CAD pricing for a hiking-sized team",
    fit: "PackRoute",
  },
  {
    need: "CAD invoices from completed hikes (plus CSV export)",
    fit: "PackRoute",
  },
  {
    need: "Boarding, daycare, pet sitting, or facility check-in",
    fit: "Time to Pet, Pet Sitter Plus, Gingr, Precise Petcare, Scout, and similar",
  },
  {
    need: "Pack school vans with owner portal, AI booking, lock-screen widgets",
    fit: "BarkBus and similar pack-school tools — or compare PackRoute if hiking pickups and SMS are the core day",
  },
];

const COST_ROWS = [
  {
    team: "1 driver",
    timeToPet: "Solo US$50/mo",
    packroute: PRICING_TIERS[0].priceLabel,
  },
  {
    team: "2 drivers",
    timeToPet: "Team ~US$72/mo ($40 + $16 × 2 staff)",
    packroute: PRICING_TIERS[1].priceLabel,
  },
  {
    team: "3 drivers",
    timeToPet: "Team ~US$88/mo ($40 + $16 × 3 staff)",
    packroute: PRICING_TIERS[2].priceLabel,
  },
];

const FAQ_ITEMS = [
  {
    q: "Is PackRoute a Time to Pet alternative?",
    a: "Yes for Canadian adventure dog hiking and group pack-walk companies. PackRoute is a lighter replacement focused on group hike time slots, multi-driver pickup routes, and customer SMS — priced in CAD, without boarding and pet-sitting features you do not use.",
  },
  {
    q: "How is PackRoute different from Time to Pet?",
    a: "Time to Pet is a broad US pet-care suite (sitting, walking, CRM, payments). PackRoute is built for hiking and pack-walk days: recurring routes, morning and afternoon slots, a mobile driver Today view, and automated SMS. You can generate CAD invoices from completed hikes or export CSV for QuickBooks.",
  },
  {
    q: "Does PackRoute have invoicing?",
    a: "Yes for CAD hike invoices: draft from closed-out hikes, mark sent, and record e-Transfer or cash. Online card pay links are next. CSV export remains on every plan — we are not asking hiking teams to keep Time to Pet just for billing.",
  },
  {
    q: "Can I switch from Time to Pet?",
    a: "Yes. Bring a CSV of clients and dogs, or we help you import during onboarding. Most teams are sending real customer texts the same day after a short screenshare.",
  },
  {
    q: "Is PackRoute priced in Canadian dollars?",
    a: "Yes. Public pricing is CAD. First month free after a short demo, then pick the driver tier that fits. See the pricing page for current beta rates.",
  },
  {
    q: "Who is Time to Pet still a better fit for?",
    a: "Operators whose core work is pet sitting, daycare, boarding, or facility check-in. PackRoute is for hiking and pack-walk teams that need calmer multi-driver route days and automated customer SMS.",
  },
];

export function TimeToPetAlternativePageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            Time to Pet alternative · Canada
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            {TIME_TO_PET_ALTERNATIVE_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            The lightweight Time to Pet replacement for Canadian dog hiking
            teams. If Time to Pet feels limited for{" "}
            <strong className="font-medium text-stone-800">
              route planning
            </strong>{" "}
            and{" "}
            <strong className="font-medium text-stone-800">
              group hike time slots
            </strong>
            , and expensive for what you actually use, PackRoute is built for
            the day you run: vans, routes, drivers, and customer SMS — priced in
            CAD.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            Built in BC for walking and adventure hiking companies. You get
            office-owned schedules, driver-owned routes, automatic customer SMS
            around real field stops, and hike exports for billing today —
            without paying for boarding, daycare, and pet-sitting workflows you
            do not run.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Why Canadian hiking teams look beyond Time to Pet
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              All-in-one pet sitting platforms optimize for visits, staff
              check-ins, and client portals. Adventure dog hiking companies
              usually need something narrower — and a clear CAD price — for
              multi-stop pickup days.
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
              What you&apos;ll pay
            </h2>
            <p className="mt-4 text-stone-600">
              PackRoute is priced in{" "}
              <strong className="font-medium text-stone-800">CAD</strong>. Time
              to Pet publishes USD plans that scale per active staff. Figures
              below are from Time to Pet&apos;s public pricing page as of{" "}
              <strong className="font-medium text-stone-800">
                November 24, 2026
              </strong>
              ; confirm on their site before you buy. CAD vs USD means Canadian
              teams also eat FX when paying a US vendor.
            </p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Team size
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Time to Pet (USD)
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      PackRoute (CAD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {COST_ROWS.map((row) => (
                    <tr key={row.team}>
                      <td className="px-4 py-3 text-stone-800">{row.team}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.timeToPet}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {row.packroute}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              PackRoute includes automated customer SMS and unlimited office
              logins on every tier, with the first month free after a demo. See{" "}
              <Link
                href="/pricing"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                full CAD pricing
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-t border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Quick fit guide
            </h2>
            <p className="mt-4 text-stone-600">
              Choose the product that matches how your days actually run.
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

        <section className="border-t border-stone-200/80 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              Billing while you switch
            </h2>
            <p className="mt-4 text-stone-600">
              PackRoute tracks dogs and completed hikes, generates CAD invoice
              drafts, and exports CSV for QuickBooks or Xero so you can bill
              however you like (e.g. e-Transfer). Online card pay links are next
              — so you can move off Time to Pet for the hiking day without
              waiting on a full ledger rebuild.
            </p>
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
              See CAD pricing, the product tour, or the adventure dog hiking
              overview — then book a demo if it fits.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/pricing"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                CAD pricing
              </Link>
              <Link
                href="/"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Product overview
              </Link>
              <Link
                href="/adventure-dog-hiking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Adventure dog hiking software
              </Link>
              <Link
                href="/dog-walking-software"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Dog walking software
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

      <MarketingFooter />
    </div>
  );
}
