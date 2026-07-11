"use client";

import { ErrorFallback } from "@/features/shared/components/error-fallback";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Dashboard error"
      description="Something went wrong loading this page. Try again or return to the dashboard."
      reset={reset}
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
