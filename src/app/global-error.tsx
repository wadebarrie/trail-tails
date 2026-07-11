"use client";

import { ErrorFallback } from "@/features/shared/components/error-fallback";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback
          title="Something went wrong"
          description="PackRoute hit an unexpected error. Try again, or return home."
          reset={reset}
        />
      </body>
    </html>
  );
}
