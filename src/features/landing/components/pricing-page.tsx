import Link from "next/link";
import { CtaButtons } from "@/features/landing/components/cta-buttons";
import { ContactEmailButton } from "@/features/landing/components/contact-email-button";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { MarketingFooter } from "@/features/legal/components/marketing-footer";
import { landingPrimaryButtonClassName } from "@/features/admin/components/button-styles";
import {
  PRICING_BETA_LOCK_DATE,
  PRICING_FAQ,
  PRICING_INCLUDED_FEATURES,
  PRICING_TIERS,
} from "@/features/landing/pricing";
import { PRICING_EMAIL_SUBJECT } from "@/features/landing/contact-email-actions";

export function PricingPageContent() {
  return (
    <div className="min-h-dvh bg-[var(--color-trail-50)] text-stone-900">
      <LandingHeader />

      <main id="main-content">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-trail-800)] sm:text-5xl">
            First month free. No card required to start.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
            Book a short demo, get set up, and run your first month on us. When
            the trial ends, pick the tier that fits — every tier ships the same
            features; tiers only set how big you can run.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
          <div className="rounded-2xl border border-[var(--color-trail-200)] bg-white px-5 py-4 text-left text-sm leading-relaxed text-stone-600 sm:px-6">
            <p>
              <strong className="font-semibold text-[var(--color-trail-800)]">
                We&apos;re in open beta.
              </strong>{" "}
              You&apos;ll find the odd rough edge, and you&apos;ll get it fixed
              the week you tell us about it. In exchange these are beta prices —
              subscribe before{" "}
              <strong className="font-medium text-stone-800">
                {PRICING_BETA_LOCK_DATE}
              </strong>{" "}
              and your rate stays put for as long as you&apos;re with us. Prices
              go up when we launch properly next year.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="grid gap-5 lg:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <article
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  tier.highlight
                    ? "border-[var(--color-trail-600)] ring-1 ring-[var(--color-trail-600)]"
                    : "border-stone-200"
                }`}
              >
                {tier.badge ? (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-trail-700)] px-3 py-0.5 text-xs font-medium text-white">
                    {tier.badge}
                  </p>
                ) : null}
                <h2 className="text-lg font-semibold text-[var(--color-trail-800)]">
                  {tier.name}
                </h2>
                <p className="mt-1 text-sm text-stone-500">1 month free</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-trail-800)]">
                  {tier.priceLabel}
                  <span className="ml-1 text-sm font-normal text-stone-500">
                    USD
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-stone-600">
                  <li>
                    <strong className="font-medium text-stone-800">
                      {tier.hikers}
                    </strong>
                  </li>
                  <li>{tier.dogs}</li>
                  {PRICING_INCLUDED_FEATURES.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-8">
                  <ContactEmailButton
                    subject={`${PRICING_EMAIL_SUBJECT} — ${tier.name}`}
                    label="Book a demo →"
                    className={`${landingPrimaryButtonClassName} w-full justify-center`}
                  />
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-stone-500">
            Annual option: pay for 10 months, get 12. Questions?{" "}
            <Link
              href="/contact"
              className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
            >
              Contact us
            </Link>
            .
          </p>
        </section>

        <section className="border-t border-stone-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-[var(--color-trail-800)]">
              The bits we get asked
            </h2>
            <dl className="mt-8 space-y-6">
              {PRICING_FAQ.map((item) => (
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

        <section className="bg-[var(--color-trail-700)] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold">See if PackRoute fits</h2>
            <p className="mt-4 text-lg text-white/80">
              Tell us how your routes run today — we&apos;ll reply within a
              business day and get your first month started.
            </p>
            <div className="mt-8">
              <CtaButtons
                primary="Book a demo"
                variant="dark"
                align="center"
              />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/dog-walking-software", label: "Product" },
          { href: "/contact", label: "Contact" },
          { href: "/login", label: "Login" },
        ]}
      />
    </div>
  );
}
