"use client";

import { ErrorFallback } from "@/features/shared/components/error-fallback";

export default function DriverError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Route unavailable"
      description="We couldn't load your route. Check your connection and try again."
      reset={reset}
      homeHref="/today"
      homeLabel="Back to Today"
    />
  );
}
