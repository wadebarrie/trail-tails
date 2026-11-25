import type { Metadata } from "next";
import Link from "next/link";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This PackRoute page does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-trail-50)] px-6 py-16 text-center">
      <PackRouteLogo className="mb-8" />
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-stone-600">
        This page doesn&apos;t exist. Head home, check pricing, or get in touch.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[var(--color-cta)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cta-hover)]"
        >
          Home
        </Link>
        <Link
          href="/pricing"
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Pricing
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
