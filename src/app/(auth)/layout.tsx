import type { Metadata } from "next";
import { PackRouteLogo } from "@/features/brand/components/packroute-logo";
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
        <PackRouteLogo href="/" markSize="sm" />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="surface-glass-strong w-full max-w-md rounded-[var(--radius-card)] p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
