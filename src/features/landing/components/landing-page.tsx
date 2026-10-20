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
  SmsPhoneMock,
} from "@/features/landing/components/mockups";
import { LANDING_FAQ_VISIBLE } from "@/features/landing/constants";
import { HOME_H1 } from "@/lib/seo/metadata";

const FAQ = LANDING_FAQ_VISIBLE;

function FaqAnswer({ text }: { text: string }) {
  const marker = "pricing page";
  const index = text.indexOf(marker);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <Link
        href="/pricing"
        className="font-medium text-[var(--color-trail-700)] underline underline-offset-2"
      >
        {marker}
      </Link>
      {text.slice(index + marker.length)}
    </>
  );
}

const FEATURES = [
  {
    title: "Automated texts for your customers",
    description:
      "Night-before confirmations, en-route ETAs, and pickup or drop-off updates fire from driver taps — so families get answers without WhatsApp group chats or drivers texting each stop.",
  },
  {
    title: "Routes that make those texts accurate",
    description:
        "Build daily pickup routes, assign drivers, manage recurring dogs, and adjust today or tomorrow — the ops layer so every SMS matches the route day.",
  },
  {
    title: "Driver workflow on mobile",
    description:
      "Drivers open Today on their phone, follow stops in order, and tap status updates. Those taps are what send customer texts — no app store download.",
  },
  {
    title: "Billing prep, not a full CRM",
    description:
      "Track completed hikes and export CSV for QuickBooks, Xero, or your own invoicing. Live QuickBooks Online and Xero sync are paid add-ons when you need them. PackRoute stays focused on the field day and customer communication.",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
      {children}
    </p>
  );
}

export function LandingPage({ showStartTrial = false }: { showStartTrial?: boolean }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-atmosphere-hero text-stone-900">
      <LandingHeader showStartTrial={showStartTrial} />

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_srgb,var(--color-sky-200)_40%,transparent)_0%,_transparent_55%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <SectionLabel>For walking and hiking companies</SectionLabel>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
                {HOME_H1}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-stone-600">
                Growing past one driver? PackRoute texts your customers for
                you — night-before reminders, ETAs, and pickup updates — so the
                office stops answering “where are you?” and drivers stop living
                in WhatsApp. It works for dog walking and adventure hiking
                teams. Routes and a simple mobile driver workflow make those
                messages accurate.
              </p>
              <div className="mt-8">
                <CtaButtons showStartTrial={showStartTrial} />
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
              Recurring dogs, multiple drivers, and last-minute skip
              requests usually mean spreadsheet mornings and group-chat ETAs.
              PackRoute keeps customers updated by automated SMS, with routes and
              drivers behind the scenes — then exports completed hikes for the
              billing tool you already use.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
                Customers get the texts. Your team runs the day.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  role: "Customer",
                  body: "Automated SMS updates by text — reminders, ETAs, pickups. Schedule requests wait for office approval — no surprise route changes.",
                },
                {
                  role: "Driver",
                  body: "Opens Today on their phone, follows the route, and taps status at each stop. Those taps send the customer texts — no manual messaging.",
                },
                {
                  role: "Office",
                  body: "A guided setup (vehicle, driver, customer, dog, route) usually takes under an hour, or a 30–45 minute screenshare where we import your spreadsheet. Then build routes, assign drivers, approve schedule requests, and export hike CSVs.",
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

        {/* Customer SMS */}
        <section id="sms" className="scroll-mt-20 py-14 sm:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <SectionLabel>Customer experience</SectionLabel>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
                Proactive updates — sent automatically
              </h2>
              <p className="mt-4 text-stone-600">
                No app or login for customers — and no manual texts from your
                drivers. When drivers tap through their route, PackRoute sends
                the messages families expect.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-stone-600">
                <li className="flex gap-2">
                  <span
                    className="mt-0.5 shrink-0 text-[var(--color-trail-600)]"
                    aria-hidden
                  >
                    ·
                  </span>
                  <span>
                    <strong className="font-medium text-stone-800">
                      Night-before confirmations
                    </strong>{" "}
                    with pickup window and driver name
                  </span>
                </li>
                <li className="flex gap-2">
                  <span
                    className="mt-0.5 shrink-0 text-[var(--color-trail-600)]"
                    aria-hidden
                  >
                    ·
                  </span>
                  <span>
                    <strong className="font-medium text-stone-800">
                      Real-time status updates
                    </strong>{" "}
                    for en-route ETAs, pickups, and drop-offs
                  </span>
                </li>
                <li className="flex gap-2">
                  <span
                    className="mt-0.5 shrink-0 text-[var(--color-trail-600)]"
                    aria-hidden
                  >
                    ·
                  </span>
                  <span>
                    <strong className="font-medium text-stone-800">
                      Fully automated
                    </strong>{" "}
                    — driver taps trigger customer texts, not group chats
                  </span>
                </li>
              </ul>
              <h3 className="mt-8 text-base font-semibold text-stone-900">
                How SMS works
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-stone-600">
                <li>Texts send from PackRoute&apos;s business number. Customers reply to that same number. It is not a private number per company.</li>
                <li>Canada and US mobile numbers. Your company is responsible for having consent to text, as described in the Terms.</li>
                <li>Customers can text STOP REMINDERS to turn off night-before reminders, and START REMINDERS to turn them back on. ETA, pickup, and drop-off texts still send while the dog is on the schedule.</li>
                <li>Message cost is included in your plan up to the active-dog cap. There is no per-text fee inside that cap.</li>
              </ul>
              <p className="mt-5 text-sm text-stone-500">
                Customers can still text to skip a day, set vacation dates, or
                pause service — your office approves before anything changes.
              </p>
            </div>
            <SmsPhoneMock />
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
                    <FaqAnswer text={item.a} />
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
                Fewer manual texts. Happier customers.
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

      <MarketingFooter />
    </div>
  );
}
