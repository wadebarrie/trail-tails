import Link from "next/link";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import { ContactForm } from "@/features/landing/components/contact-form";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import {
  AdminDashboardMock,
  DriverMobileMock,
  HeroDashboardMock,
} from "@/features/landing/components/mockups";
import { LANDING_FAQ_VISIBLE } from "@/features/landing/constants";
import { HOME_H1 } from "@/lib/seo/metadata";

const FAQ = LANDING_FAQ_VISIBLE;

const FEATURES = [
  {
    title: "Routes and schedules",
    description:
      "Build daily routes, assign drivers, manage recurring dogs, and adjust today or tomorrow without rebuilding a spreadsheet.",
  },
  {
    title: "Driver workflow on mobile",
    description:
      "Drivers open Today, follow stops in order, and tap simple status updates from their phone.",
  },
  {
    title: "Customer SMS, office-approved",
    description:
      "Send reminders, ETAs, and pickup confirmations. Customer requests wait for office approval before anything changes.",
  },
  {
    title: "Billing export",
    description:
      "Track completed hikes by date range and export CSVs for QuickBooks or your own invoicing process.",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
      {children}
    </p>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-atmosphere-hero text-stone-900">
      <LandingHeader />

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_srgb,var(--color-sky-200)_40%,transparent)_0%,_transparent_55%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <SectionLabel>Route planning &amp; customer updates</SectionLabel>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
                {HOME_H1}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-stone-600">
                Plan recurring dogs and pickup routes, give drivers a simple
                mobile workflow, and keep customers updated by text — without
                spreadsheet or group chat chaos.
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

        {/* Who it's for */}
        <section className="border-y border-[var(--glass-border-subtle)] surface-glass py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)] sm:text-3xl">
              Built for adventure dog hiking teams
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-600">
              Recurring dogs, multiple drivers, pickup routes, and schedule
              changes — usually spread across spreadsheets and group texts.
              PackRoute brings routes, drivers, customer SMS, and billing prep
              together.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-14 sm:py-16">
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
                  body: "Build routes, assign drivers, approve schedule requests, and export billing.",
                },
                {
                  role: "Driver",
                  body: "Open Today on their phone — stops in order, status taps.",
                },
                {
                  role: "Customer",
                  body: "SMS updates by text. Schedule requests wait for office approval.",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="surface-elevated rounded-[var(--radius-card)] p-6 motion-lift"
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
        <section id="features" className="scroll-mt-20 surface-glass py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <SectionLabel>Features</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
                What you get
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="surface-card rounded-[var(--radius-card)] p-5 motion-interactive hover:shadow-[var(--elevation-2)]"
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

        {/* Product previews */}
        <section id="product" className="scroll-mt-20 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <SectionLabel>See it in action</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
                Office dashboard and driver view
              </h2>
            </div>

            <div className="mt-12 grid gap-16 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-trail-800)]">
                    Office dashboard
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    Today&apos;s routes and pending requests.
                  </p>
                  <Link
                    href="/login?role=admin"
                    className="mt-3 inline-flex text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
                  >
                    Office login →
                  </Link>
                </div>
                <AdminDashboardMock />
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-trail-800)]">
                    Driver mobile view
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    Stop list and status taps in the mobile browser.
                  </p>
                  <Link
                    href="/login?role=driver"
                    className="mt-3 inline-flex text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
                  >
                    Driver login →
                  </Link>
                </div>
                <DriverMobileMock />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 surface-glass py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
              Common questions
            </h2>
            <dl className="mt-8 divide-y divide-stone-200 surface-elevated overflow-hidden rounded-[var(--radius-card)]">
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
          className="scroll-mt-20 bg-[var(--color-trail-700)] py-14 text-white sm:py-16"
        >
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Less coordinating. More hiking.
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Book a demo — we&apos;ll reply within a business day.
              </p>
            </div>

            <div className="mt-8 rounded-[var(--radius-card)] border border-white/15 surface-glass-dark p-6 sm:p-8">
              <ContactForm variant="dark" />
            </div>

            <ContactEmailFallback variant="dark" className="mt-4 text-center" />

            <p className="mt-6 text-center text-sm text-white/60">
              <Link href="/login" className="underline-offset-2 hover:underline">
                Team login
              </Link>
              {" · "}
              <Link href="/contact" className="underline-offset-2 hover:underline">
                Full contact page
              </Link>
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter
        extraLinks={[
          { href: "/#how-it-works", label: "How it works" },
          { href: "/#features", label: "Features" },
          { href: "/contact", label: "Contact" },
          { href: "/dog-walking-software", label: "Dog walking software" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
