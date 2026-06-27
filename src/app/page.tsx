import Link from "next/link";
import { primaryButtonClassName } from "@/features/admin/components/button-styles";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-trail-600)]">
          PackRoute
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-trail-800)]">
          Dog hike operations, simplified
        </h1>
        <p className="mt-3 text-stone-600">
          Manage schedules, keep customers updated, and give drivers a dead-simple
          mobile workflow.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/login?role=admin"
            className={`${primaryButtonClassName} rounded-xl px-6 py-4 text-base`}
          >
            Office login
          </Link>
          <Link
            href="/login?role=driver"
            className="rounded-xl border border-stone-300 bg-white px-6 py-4 text-base font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
          >
            Driver login
          </Link>
        </div>
      </div>
    </main>
  );
}
