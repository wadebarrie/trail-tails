import Link from "next/link";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import {
  AdminDashboardMock,
  DriverMobileMock,
  HeroDashboardMock,
  SmsPhoneMock,
} from "@/features/landing/components/mockups";
import { DEMO_MAILTO, LANDING_FAQ, WAITLIST_MAILTO } from "@/features/landing/constants";

const FAQ = LANDING_FAQ;

const FEATURES = [
  {
    title: "Customer SMS from driver taps",
    description:
      "Night-before reminders, en-route ETAs, and pickup or drop-off confirmations — sent when drivers update stops.",
  },
  {
    title: "A driver view drivers will use",
    description:
      "Mobile web Today view, clear stop list, fast status taps. Add to home screen — no app store required.",
  },
  {
    title: "Schedule changes by text",
    description:
      "Customers text plain-English requests. Nothing changes until the office approves.",
  },
  {
    title: "Routes your team controls",
    description:
      "Drag-and-drop pickup order, multiple routes and drivers, today and tomorrow overrides.",
  },
  {
    title: "Billing prep, not billing software",
    description:
      "Track completed hikes by date range and export CSV for QuickBooks or your own invoices.",
  },
  {
    title: "Your team stays in control",
    description:
      "Routes, skips, and schedule changes go through the office — not the software.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
      {children}
    </p>
  );
}

function CtaButtons({
  primary = "Book a demo",
  showEarlyAccess = false,
}: {
  primary?: string;
  showEarlyAccess?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <a href={DEMO_MAILTO} className={`${primaryButtonClassName} px-6 py-3 text-base`}>
          {primary}
        </a>
        {showEarlyAccess ? (
          <a
            href={WAITLIST_MAILTO}
            className={`${secondaryButtonClassName} px-6 py-3 text-base`}
          >
            Get early access
          </a>
        ) : (
          <a
            href="#how-it-works"
            className={`${secondaryButtonClassName} px-6 py-3 text-base`}
          >
            See how it works
          </a>
        )}
      </div>
      <ContactEmailFallback className="mt-3" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-trail-100)_0%,_transparent_55%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <SectionLabel>Built for adventure dog hiking teams</SectionLabel>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
              Software for adventure dog hiking companies
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600">
              Your office plans the schedule and routes. Drivers run the day
              from their phone. Customers get clear texts — without the group
              chat chaos.
            </p>
            <div className="mt-8">
              <CtaButtons />
            </div>
            <p className="mt-4 text-sm text-stone-500">
              Already on PackRoute?{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
              >
                Team login
              </Link>
            </p>
          </div>
          <div className="lg:pl-4">
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-stone-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold text-[var(--color-trail-800)] sm:text-4xl">
            Your business is not a regular dog walking business.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            Adventure dog hiking companies manage recurring dogs, multiple
            drivers, pickup routes, drop-off routes, schedule changes, customer
            texts, and billing periods — often across spreadsheets, group chats,
            and memory.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            PackRoute brings routes, drivers, customer SMS, skip requests, and
            billing prep into one place — so your team spends less time
            coordinating and more time on the trail.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              The office plans. The driver runs the route.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                role: "Office",
                body: "Build routes, assign dogs and drivers, approve schedule requests, and prepare billing exports.",
              },
              {
                role: "Driver",
                body: "Open Today on their phone, follow their stops, and tap En Route, Arrived, Picked Up, or Dropped Off.",
              },
              {
                role: "Customer",
                body: "Gets plain-English texts. No app. Can reply with SKIP TOMORROW or LATE PICKUP — your team approves before anything changes.",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-trail-100)] text-sm font-semibold text-[var(--color-trail-700)]">
                  {item.role.charAt(0)}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[var(--color-trail-800)]">
                  {item.role}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              Built for how you actually operate
            </h2>
            <p className="mt-3 text-stone-600">
              Clear roles, fewer text threads, and tools that match a real
              multi-driver hiking day.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-stone-200 bg-[var(--color-trail-50)] p-5"
              >
                <h3 className="font-semibold text-[var(--color-trail-800)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMS */}
      <section id="sms" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionLabel>Customer SMS</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              Updates customers want — by text.
            </h2>
            <p className="mt-4 text-stone-600">
              Customers never need an account. They get useful texts when
              drivers update stops, and can reply with simple schedule requests.
            </p>
            <p className="mt-3 text-sm text-stone-500">
              Every schedule change is reviewed by your team before it takes
              effect — skips stay intentional, not accidental.
            </p>
          </div>
          <SmsPhoneMock />
        </div>
      </section>

      {/* Driver teaser */}
      <section className="bg-[var(--color-trail-800)] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <DriverMobileMock />
          <div className="lg:order-first">
            <SectionLabel>
              <span className="text-green-300">Driver app</span>
            </SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold">
              The driver runs the route.
            </h2>
            <p className="mt-4 text-white/75">
              Drivers open Today, see their stops, and tap through the day.
              When location is enabled, arrival near a stop can update
              automatically — otherwise they tap Arrived. Families get the
              message either way.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li>· Today view with pickups and drop-offs</li>
              <li>· En Route, Picked Up, Dropped Off in taps</li>
              <li>· Optional GPS-assisted arrival — manual tap always works</li>
              <li>· Works in the mobile browser — no app store</li>
            </ul>
            <Link
              href="/login?role=driver"
              className="mt-6 inline-flex text-sm font-medium text-green-300 underline-offset-2 hover:underline"
            >
              Driver login →
            </Link>
          </div>
        </div>
      </section>

      {/* Admin teaser */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionLabel>Office dashboard</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              See today at a glance.
            </h2>
            <p className="mt-4 text-stone-600">
              Routes, drivers, pending customer requests, billing summaries, and
              notification history — one dashboard for the office team that
              owns the schedule.
            </p>
            <Link
              href="/login?role=admin"
              className="mt-6 inline-flex text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
            >
              Office login →
            </Link>
          </div>
          <AdminDashboardMock />
        </div>
      </section>

      {/* Billing */}
      <section className="border-y border-stone-200/80 bg-[var(--color-trail-50)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionLabel>Billing</SectionLabel>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
            Hike counts ready for billing
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            Review completed hikes by billing period, apply adjustments, and
            export a clean CSV for QuickBooks or your own invoicing workflow.
          </p>
          <p className="mt-3 text-sm text-stone-500">
            PackRoute does not process payments or send invoices — it prepares
            the numbers so you can bill your way.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
            Common questions
          </h2>
          <dl className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span
                      aria-hidden
                      className="text-stone-400 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <dd className="mt-3 text-sm leading-relaxed text-stone-600">
                  {item.a}
                </dd>
              </details>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="contact"
        className="scroll-mt-20 bg-[var(--color-trail-700)] py-16 text-white sm:py-20"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Less coordinating. More hiking.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Give your office clear schedules, your drivers a simple day view,
            and your customers texts they can trust.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={DEMO_MAILTO}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-[var(--color-trail-800)] transition hover:bg-stone-100"
            >
              Book a demo
            </a>
            <a
              href={WAITLIST_MAILTO}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
            >
              Get early access
            </a>
          </div>
          <ContactEmailFallback variant="dark" className="mt-4" />
          <p className="mt-6 text-sm text-white/60">
            <Link href="/login" className="underline-offset-2 hover:underline">
              Team login
            </Link>
            {" · "}
            <Link
              href="/login?role=admin"
              className="underline-offset-2 hover:underline"
            >
              Office login
            </Link>
            {" · "}
            <Link
              href="/login?role=driver"
              className="underline-offset-2 hover:underline"
            >
              Driver login
            </Link>
          </p>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-semibold text-[var(--color-trail-800)]">PackRoute</p>
            <p className="mt-1 text-sm text-stone-500">
              Software for adventure dog hiking teams.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-4 text-sm text-stone-600">
            <a href="#how-it-works" className="hover:text-[var(--color-trail-700)]">
              How it works
            </a>
            <a href="#features" className="hover:text-[var(--color-trail-700)]">
              Features
            </a>
            <Link href="/login" className="hover:text-[var(--color-trail-700)]">
              Login
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
