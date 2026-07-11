"use client";

import { ErrorFallback } from "@/features/shared/components/error-fallback";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Something went wrong"
      description="We couldn't load this page. Your data is safe — try again or head home."
      reset={reset}
    />
  );
}
