"use client";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { ContactEmailButton } from "@/features/landing/components/contact-email-button";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import {
  DEMO_EMAIL_SUBJECT,
  WAITLIST_EMAIL_SUBJECT,
} from "@/features/landing/contact-email-actions";

export function CtaButtons({
  primary = "Book a demo",
  showEarlyAccess = false,
  primaryClassName = `${primaryButtonClassName} px-6 py-3 text-base`,
  secondaryClassName = `${secondaryButtonClassName} px-6 py-3 text-base`,
}: {
  primary?: string;
  showEarlyAccess?: boolean;
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ContactEmailButton
          subject={DEMO_EMAIL_SUBJECT}
          label={primary}
          className={primaryClassName}
        />
        {showEarlyAccess ? (
          <ContactEmailButton
            subject={WAITLIST_EMAIL_SUBJECT}
            label="Get early access"
            className={secondaryClassName}
          />
        ) : (
          <a href="#how-it-works" className={secondaryClassName}>
            See how it works
          </a>
        )}
      </div>
      <ContactEmailFallback className="mt-3" />
    </div>
  );
}

/** Final CTA section buttons on dark background. */
export function ContactCtaButtons() {
  return (
    <>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ContactEmailButton
          subject={DEMO_EMAIL_SUBJECT}
          label="Book a demo"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-[var(--color-trail-800)] transition hover:bg-stone-100"
        />
        <ContactEmailButton
          subject={WAITLIST_EMAIL_SUBJECT}
          label="Get early access"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
        />
      </div>
      <ContactEmailFallback variant="dark" className="mt-4" />
    </>
  );
}
