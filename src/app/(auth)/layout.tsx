import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-atmosphere-auth">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--color-trail-700)] motion-interactive hover:underline"
        >
          ← PackRoute
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="surface-glass-strong w-full max-w-md rounded-[var(--radius-card)] p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
