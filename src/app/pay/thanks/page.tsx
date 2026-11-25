import type { Metadata } from "next";
import Link from "next/link";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";

export const metadata: Metadata = {
  title: "Payment",
  description: "Invoice payment confirmation",
  robots: { index: false, follow: false },
};

export default async function PayThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string; cancelled?: string }>;
}) {
  const { invoice, cancelled } = await searchParams;
  const wasCancelled = cancelled === "1" || cancelled === "true";
  const invoiceLabel = invoice?.trim();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-trail-50)] px-6 py-16 text-center">
      <PackRouteLogo className="mb-8" />
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">
        {wasCancelled ? "Payment cancelled" : "Thank you"}
      </h1>
      <p className="mt-3 max-w-md text-stone-600">
        {wasCancelled
          ? invoiceLabel
            ? `No charge was made for invoice ${invoiceLabel}. You can close this window or ask the office for a new pay link.`
            : "No charge was made. You can close this window or ask the office for a new pay link."
          : invoiceLabel
            ? `Payment for invoice ${invoiceLabel} was received. You can close this window.`
            : "Payment received. You can close this window."}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        PackRoute home
      </Link>
    </div>
  );
}
