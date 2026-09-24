"use client";

import Link from "next/link";
import { useState } from "react";
import {
  landingPrimaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { ContactEmailButton } from "@/features/landing/components/contact-email-button";
import { DEMO_EMAIL_SUBJECT } from "@/features/landing/contact-email-actions";
import { GoogleAnalytics } from "@/features/landing/components/google-analytics";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import { NAV_LINKS } from "@/features/landing/constants";
import { trackEvent } from "@/features/landing/analytics";

export function LandingHeader({
  showStartTrial = false,
}: {
  showStartTrial?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <GoogleAnalytics />
      <header className="surface-header sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <PackRouteLogo
          href="/"
          markSize="lg"
          wordmarkClassName="text-lg"
          priority
        />

        <nav
          aria-label="Main"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-600 motion-interactive hover:text-[var(--color-trail-700)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-stone-600 motion-interactive hover:text-[var(--color-trail-700)]"
          >
            Login
          </Link>
          {showStartTrial ? (
            <Link
              href="/signup"
              className={`${landingPrimaryButtonClassName} min-h-11 px-4 py-2 text-sm`}
              onClick={() =>
                trackEvent("start_trial", { location: "header" })
              }
            >
              Start free trial
            </Link>
          ) : (
            <ContactEmailButton
              subject={DEMO_EMAIL_SUBJECT}
              label="Book a demo"
              className={`${landingPrimaryButtonClassName} min-h-11 px-4 py-2 text-sm`}
              eventName="book_demo"
              eventLocation="header"
            />
          )}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-surface)] ${secondaryButtonClassName} md:hidden`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="motion-sheet border-t border-[var(--glass-border-subtle)] surface-glass-strong px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-surface)] px-3 py-2.5 text-sm font-medium text-stone-700 motion-interactive hover:bg-white/60"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-[var(--radius-surface)] px-3 py-2.5 text-sm font-medium text-stone-700 motion-interactive hover:bg-white/60"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            {showStartTrial ? (
              <Link
                href="/signup"
                className={`${landingPrimaryButtonClassName} mt-2 min-h-11 w-full px-4 py-2.5 text-sm`}
                onClick={() => {
                  trackEvent("start_trial", { location: "header_mobile" });
                  setOpen(false);
                }}
              >
                Start free trial
              </Link>
            ) : (
              <ContactEmailButton
                subject={DEMO_EMAIL_SUBJECT}
                label="Book a demo"
                className={`${landingPrimaryButtonClassName} mt-2 min-h-11 w-full px-4 py-2.5 text-sm`}
                eventName="book_demo"
                eventLocation="header_mobile"
              />
            )}
          </nav>
        </div>
      ) : null}
    </header>
    </>
  );
}
