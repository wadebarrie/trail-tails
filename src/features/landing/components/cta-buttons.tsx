"use client";

import Link from "next/link";
import {
  landingPrimaryButtonClassName,
  landingSecondaryDarkClassName,
  landingSecondaryLightClassName,
} from "@/features/admin/components/button-styles";
import { trackEvent } from "@/features/landing/analytics";

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
  showStartTrial = false,
  variant = "light",
  align = "start",
  primaryClassName,
  secondaryClassName,
}: {
  primary?: string;
  showEarlyAccess?: boolean;
  showHowItWorks?: boolean;
  /** When self-serve signup is open — secondary link to /signup */
  showStartTrial?: boolean;
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

  return (
    <div className={rowClassName}>
      {showStartTrial ? (
        <Link
          href="/signup"
          className={resolvedPrimaryClassName}
          onClick={() => trackEvent("start_trial", { location: "cta" })}
        >
          Start free trial
        </Link>
      ) : (
        <Link
          href="/demo"
          className={resolvedPrimaryClassName}
          onClick={() => trackEvent("book_demo", { location: "cta" })}
        >
          {primary}
        </Link>
      )}
      {showStartTrial ? (
        <Link
          href="/demo"
          className={resolvedSecondaryClassName}
          onClick={() =>
            trackEvent("book_demo", { location: "cta_secondary" })
          }
        >
          Book a demo
        </Link>
      ) : showEarlyAccess ? (
        <Link
          href="/contact"
          className={resolvedSecondaryClassName}
          onClick={() => trackEvent("early_access", { location: "cta" })}
        >
          Get early access
        </Link>
      ) : showHowItWorks ? (
        <Link href="/#how-it-works" className={resolvedSecondaryClassName}>
          See how it works
        </Link>
      ) : null}
    </div>
  );
}
