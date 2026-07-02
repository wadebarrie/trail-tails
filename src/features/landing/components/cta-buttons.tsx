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
          <a href="/#how-it-works" className={secondaryClassName}>
            See how it works
          </a>
        )}
      </div>
      <ContactEmailFallback className="mt-3" />
    </div>
  );
}
