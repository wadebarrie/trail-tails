"use client";

import Link from "next/link";
import { useState } from "react";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";
import { DEMO_MAILTO, NAV_LINKS } from "@/features/landing/constants";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[var(--color-trail-50)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--color-trail-800)]"
        >
          PackRoute
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-600 transition hover:text-[var(--color-trail-700)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-stone-600 transition hover:text-[var(--color-trail-700)]"
          >
            Login
          </Link>
          <a href={DEMO_MAILTO} className={`${primaryButtonClassName} px-4 py-2`}>
            Book a demo
          </a>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-stone-200 bg-white px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            <a
              href={DEMO_MAILTO}
              className={`${primaryButtonClassName} mt-2 justify-center`}
            >
              Book a demo
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
