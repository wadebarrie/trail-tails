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
  variant = "light",
  align = "start",
  primaryClassName,
  secondaryClassName,
}: {
  primary?: string;
  showEarlyAccess?: boolean;
  variant?: "light" | "dark";
  align?: "start" | "center";
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  const resolvedPrimaryClassName =
    primaryClassName ?? `${primaryButtonClassName} px-6 py-3 text-base`;
  const resolvedSecondaryClassName =
    secondaryClassName ??
    (variant === "dark"
      ? "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/20"
      : `${secondaryButtonClassName} px-6 py-3 text-base`);

  const rowClassName =
    align === "center"
      ? "flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
      : "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center";

  const fallbackClassName = align === "center" ? "mt-3 text-center" : "mt-3";

  return (
    <div>
      <div className={rowClassName}>
        <ContactEmailButton
          subject={DEMO_EMAIL_SUBJECT}
          label={primary}
          className={resolvedPrimaryClassName}
        />
        {showEarlyAccess ? (
          <ContactEmailButton
            subject={WAITLIST_EMAIL_SUBJECT}
            label="Get early access"
            className={resolvedSecondaryClassName}
          />
        ) : (
          <a href="/#how-it-works" className={resolvedSecondaryClassName}>
            See how it works
          </a>
        )}
      </div>
      <ContactEmailFallback variant={variant} className={fallbackClassName} />
    </div>
  );
}
