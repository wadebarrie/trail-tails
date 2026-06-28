"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/constants";
import type { AdminMfaStatus } from "@/features/auth/mfa";

type AdminMfaGateProps = {
  status: AdminMfaStatus;
  children: React.ReactNode;
};

export function AdminMfaGate({ status, children }: AdminMfaGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onMfaPage = pathname.startsWith(AUTH_ROUTES.adminMfa);

  useEffect(() => {
    if (onMfaPage) return;

    if (!status.enrolled) {
      router.replace(`${AUTH_ROUTES.adminMfa}?setup=1`);
      return;
    }

    if (status.needsVerify) {
      router.replace(`${AUTH_ROUTES.adminMfa}?verify=1`);
    }
  }, [onMfaPage, status.enrolled, status.needsVerify, router]);

  if (!onMfaPage && (!status.enrolled || status.needsVerify)) {
    return (
      <div className="py-12 text-center text-sm text-stone-500">
        Checking security settings…
      </div>
    );
  }

  return children;
}
