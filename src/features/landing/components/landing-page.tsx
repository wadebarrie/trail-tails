import Link from "next/link";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { LandingHeader } from "@/features/landing/components/landing-header";
import {
  AdminDashboardMock,
  DriverMobileMock,
  HeroDashboardMock,
  SmsPhoneMock,
} from "@/features/landing/components/mockups";
import { DEMO_MAILTO, WAITLIST_MAILTO } from "@/features/landing/constants";

const FEATURES = [
  {
    title: "Automated SMS updates",
    description:
      "Night-before reminders, ETA texts, pickup confirmations, and drop-off updates.",
  },
  {
    title: "Driver app that drivers actually use",
    description:
      "Mobile web, simple Today view, status updates, and a GPS-aware workflow.",
  },
  {
    title: "Schedule changes by text",
    description:
      "Customers text plain English requests. Admin approves before anything changes.",
  },
  {
    title: "Routes and stops, your way",
    description:
      "Drag-and-drop route ordering, today/tomorrow overrides, and multiple drivers.",
  },
  {
    title: "Billing built in",
    description:
      "Track completed hikes by date range and export CSV for QuickBooks or manual invoicing.",
  },
  {
    title: "Human in the loop",
    description:
      "Nothing changes on a route until the office approves it.",
  },
];

const FAQ = [
  {
    q: "Do customers need to download an app?",
    a: "No. Customers receive SMS updates and can reply by text.",
  },
  {
    q: "Can schedule changes happen automatically?",
    a: "No. Customer texts create pending requests. The office approves before schedules change.",
  },
  {
    q: "Does PackRoute optimize routes automatically?",
    a: "No. You set the order. Drivers follow the route.",
  },
  {
    q: "What if GPS fails?",
    a: "Drivers can still update stops manually.",
  },
  {
    q: "Does it work on iPhone and Android?",
    a: "Yes. The driver app is mobile web.",
  },
  {
    q: "Is pricing available?",
    a: "Book a demo or get early access — we’ll walk you through pricing for your operation.",
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
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-trail-100)_0%,_transparent_55%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <SectionLabel>Dog hike operations, simplified</SectionLabel>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
              Software Built for Adventure Dog Hiking Companies
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600">
              Manage schedules, keep customers updated, and give drivers a
              dead-simple mobile workflow.
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
            PackRoute helps you run schedules, routes, drivers, customer SMS
            updates, skip requests, and billing prep from one simple platform —
            so you spend less time coordinating and more time on the trail.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              One platform. Three simple roles.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                role: "Office",
                body: "Set routes, assign dogs, approve SMS requests, manage schedules, and prepare billing.",
              },
              {
                role: "Driver",
                body: "Open Today on their phone, follow their route, and tap simple status updates.",
              },
              {
                role: "Customer",
                body: "Gets texts. No app. No login. Can text simple requests like SKIP TOMORROW or HELP.",
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
              Less admin. More adventure
            </h2>
            <p className="mt-3 text-stone-600">
              Less texting. More trail time. Everything your office and drivers
              need — without the chaos.
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
              Updates customers actually want — by text.
            </h2>
            <p className="mt-4 text-stone-600">
              Customers never need an account. They get useful updates by text
              and can reply with simple schedule requests.
            </p>
            <p className="mt-3 text-sm text-stone-500">
              Every schedule change is reviewed by your team before it takes
              effect. No accidental skips.
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
              Designed around your daily operation.
            </h2>
            <p className="mt-4 text-white/75">
              Drivers open Today on their phone, see their stops, tap En Route,
              and go. Location-aware arrival when GPS is on — manual updates
              when it&apos;s not.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li>· Today view with pickups and drop-offs</li>
              <li>· En Route, Picked Up, Dropped Off in taps</li>
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
              notification history — all in one place for your office team.
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
            Simplify Hike Tracking & Billing
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            Track completed hikes by billing period, review billable hikes, apply
            adjustments, and export a clean CSV for QuickBooks or manual
            invoicing.
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
            Run a smoother dog hiking business.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Spend less time coordinating, texting, and counting hikes — and more
            time delivering great adventures.
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

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-semibold text-[var(--color-trail-800)]">PackRoute</p>
            <p className="mt-1 text-sm text-stone-500">
              Dog hike operations, simplified.
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
