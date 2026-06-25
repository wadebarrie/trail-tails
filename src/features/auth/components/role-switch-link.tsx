import Link from "next/link";
import { hasDualAccess } from "@/features/auth/access";
import type { Profile } from "@/types";

type RoleSwitchLinkProps = {
  profile: Pick<Profile, "role" | "can_drive">;
  variant: "admin" | "driver";
};

export function RoleSwitchLink({ profile, variant }: RoleSwitchLinkProps) {
  if (!hasDualAccess(profile)) return null;

  if (variant === "admin") {
    return (
      <Link
        href="/today"
        className="inline-flex min-h-11 items-center rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-[var(--color-trail-600)] hover:text-[var(--color-trail-700)]"
      >
        Driver view
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
    >
      Admin dashboard
    </Link>
  );
}
