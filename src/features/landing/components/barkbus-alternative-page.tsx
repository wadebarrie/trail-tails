import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { BARKBUS_ALTERNATIVE_TITLE } from "@/lib/seo/metadata";

const FIT_POINTS = [
  {
    title: "Adventure hiking pickups, not pack-school suites",
    body: "PackRoute is built for companies that run trail and group hikes with van pickups and drop-offs — office-owned schedules, driver-owned days, and SMS to households.",
  },
  {
    title: "Multi-van routes without an owner app",
    body: "Assign vehicles and drivers to morning or afternoon routes. Customers get texts; they do not need a portal login to know when the van is en route.",
  },
  {
    title: "Driver web workflow that answers “what next?”",
    body: "Hikers open Today in the browser, see their vehicle and stops, tap En Route / Arrived / Picked up / Dropped off, and keep moving — no app-store install required.",
  },
  {
    title: "SMS-first customer communication",
    body: "Night-before reminders, en-route ETAs, and pickup or drop-off confirmations fire from intentional driver actions. Schedule-change texts land in your office first.",
  },
];

const COMPARISON_ROWS = [
  {
    need: "Adventure dog hiking / pack walks with pickup routes in the US & Canada",
    fit: "PackRoute",
  },
  {
    need: "Pack school / daycare vans with owner portal, AI booking, lock-screen widgets",
    fit: "BarkBus and similar van-first pack-school tools",
  },
  {
    need: "Broad pet sitting, boarding, or photo visit reporting",
    fit: "Time to Pet, Pet Sitter Plus, Gingr, and similar",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is PackRoute a BarkBus alternative?",
    a: "For adventure dog hiking teams that want office-owned routes, multi-van pickup days, and customer SMS without requiring an owner app, yes. BarkBus is strong for pack-school ops with AI admin help, lock-screen pickups, and owner portals. PackRoute is narrower: calm route operations and SMS for hiking and pack-walk businesses.",
  },
  {
    q: "Does PackRoute replace BarkBus’s owner portal?",
    a: "No — PackRoute is SMS-first. Customers get texts for reminders, ETAs, and confirmations without downloading an app or logging into a portal.",
  },
  {
    q: "Can PackRoute assign multiple vans?",
    a: "Yes. You can manage vehicles, set a default vehicle on a route, and override the van for a given hike day so drivers see which vehicle they are running.",
  },
];

export function BarkBusAlternativePageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            BarkBus alternative
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            {BARKBUS_ALTERNATIVE_TITLE}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            Searching for a BarkBus alternative because your core day is adventure
            dog hiking pickups — not a full pack-school product suite? PackRoute
            is dog walking operations software for multi-van route days and
            customer SMS.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            BarkBus is a strong product for pack schools that want vans, AI admin
            help, lock-screen pickups, and owner apps. PackRoute is different on
            purpose: calmer route planning, driver mobile web, and SMS that
            doesn&apos;t require customers to install anything.
          </p>
          <div className="mt-8">
            <CtaButtons />
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Why hiking teams compare PackRoute with BarkBus
            </h2>
            <p className="mt-4 max-w-2xl text-stone-600">
              Both tools care about vans and pickups. The fit depends on whether
              you need a pack-school suite or a focused adventure hiking ops
              layer.
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
              Quick fit guide vs BarkBus and other tools
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
              BarkBus alternative FAQ
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
              See the product tour, Time to Pet comparison, or adventure dog hiking
              overview — then book a demo if it fits.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Product overview
              </Link>
              <Link
                href="/time-to-pet-alternative"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Time to Pet alternative
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
              Tell us how your routes and vans run today — we&apos;ll reply within
              a business day.
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
          { href: "/time-to-pet-alternative", label: "Time to Pet alternative" },
          { href: "/contact", label: "Contact" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
