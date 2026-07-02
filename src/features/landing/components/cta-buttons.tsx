"use client";

import {
  landingPrimaryButtonClassName,
  landingSecondaryDarkClassName,
  landingSecondaryLightClassName,
} from "@/features/admin/components/button-styles";
import { ContactEmailButton } from "@/features/landing/components/contact-email-button";
import { ContactEmailFallback } from "@/features/landing/components/contact-email-fallback";
import {
  DEMO_EMAIL_SUBJECT,
  WAITLIST_EMAIL_SUBJECT,
} from "@/features/landing/contact-email-actions";

function primaryButtonClasses() {
  return landingPrimaryButtonClassName;
}

function secondaryButtonClasses(variant: "light" | "dark") {
  return variant === "dark"
    ? landingSecondaryDarkClassName
    : landingSecondaryLightClassName;
}

export function CtaButtons({
  primary = "Book a demo",
  showEarlyAccess = false,
  showHowItWorks = false,
  variant = "light",
  align = "start",
  primaryClassName,
  secondaryClassName,
}: {
  primary?: string;
  showEarlyAccess?: boolean;
  showHowItWorks?: boolean;
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
        ) : showHowItWorks ? (
          <a href="/#how-it-works" className={resolvedSecondaryClassName}>
            See how it works
          </a>
        ) : null}
      </div>
      <ContactEmailFallback variant={variant} className={fallbackClassName} />
    </div>
  );
}
