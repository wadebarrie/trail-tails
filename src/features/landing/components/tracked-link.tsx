"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/features/landing/analytics";

export function TrackedLink({
  href,
  className,
  children,
  eventName,
  eventLocation,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  eventName: string;
  eventLocation?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackEvent(eventName, {
          location: eventLocation,
        })
      }
    >
      {children}
    </Link>
  );
}
