import Link from "next/link";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import { FooterContactEmail } from "@/features/landing/components/footer-contact-email";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/data-processing", label: "Data Processing" },
] as const;

type MarketingFooterProps = {
  /** Extra nav links before legal links (e.g. How it works on homepage). */
  extraLinks?: { href: string; label: string }[];
};

export function MarketingFooter({ extraLinks = [] }: MarketingFooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 sm:text-left">
        <div>
          <PackRouteLogo href="/" markSize="sm" />
          <p className="mt-1 text-sm text-stone-500">
            Dog walking route planning for adventure hike teams.
          </p>
          <FooterContactEmail />
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-stone-600"
        >
          {extraLinks.map((link) =>
            link.href.startsWith("/#") ? (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[var(--color-trail-700)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-[var(--color-trail-700)]"
              >
                {link.label}
              </Link>
            )
          )}
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[var(--color-trail-700)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
