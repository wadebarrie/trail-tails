import Link from "next/link";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
import { FooterContactEmail } from "@/features/landing/components/footer-contact-email";

/**
 * Staff term is "driver" on marketing pages (walking and hiking teams).
 * Nav stays on the main tasks. Footer also links the SMS section, the
 * dog-walking page, and legal docs so those aren't only in the header.
 */
const FOOTER_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#sms", label: "Customer SMS" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dog-walking-software", label: "Dog walking software" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/data-processing", label: "Data Processing" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 sm:text-left">
        <div className="min-w-0">
          <PackRouteLogo href="/" markSize="sm" />
          <p className="mt-1 max-w-md text-sm text-stone-500">
            Customer texts for dog walking and adventure hiking teams.
          </p>
          <FooterContactEmail />
        </div>
        <nav
          aria-label="Footer"
          className="flex max-w-xl flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-stone-600"
        >
          {FOOTER_LINKS.map((link) =>
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
