import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-trail-50)]">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--color-trail-700)] hover:underline"
        >
          ← PackRoute
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        {children}
      </div>
    </div>
  );
}
