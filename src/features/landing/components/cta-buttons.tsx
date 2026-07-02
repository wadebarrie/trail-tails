"use client";

import { ContactEmailButton } from "@/features/landing/components/contact-email-button";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import {
  DEMO_EMAIL_SUBJECT,
  WAITLIST_EMAIL_SUBJECT,
} from "@/features/landing/contact-email-actions";

const landingButtonBase =
  "inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-medium transition-colors";

function primaryButtonClasses() {
  return `${landingButtonBase} bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)] active:bg-[var(--color-cta-active)]`;
}

function secondaryButtonClasses(variant: "light" | "dark") {
  if (variant === "dark") {
    return `${landingButtonBase} border border-white/30 bg-white/10 text-white hover:bg-white/20`;
  }
  return `${landingButtonBase} border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100`;
}

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
    primaryClassName ?? primaryButtonClasses();
  const resolvedSecondaryClassName =
    secondaryClassName ?? secondaryButtonClasses(variant);

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
