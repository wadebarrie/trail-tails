import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { RoleSwitchLink } from "@/features/auth/components/role-switch-link";
import { requireDriverAccess } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireDriverAccess();

  return (
    <div className="min-h-dvh bg-[var(--color-trail-800)] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            Trail Tails · Driver
          </p>
          <p className="mt-0.5 text-sm text-white/80">{profile.full_name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RoleSwitchLink profile={profile} variant="driver" />
          <SignOutButton
            className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
          />
        </div>
      </header>
      <main className="px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
