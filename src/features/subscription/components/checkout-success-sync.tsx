"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finalizeCheckoutSessionAction } from "@/features/subscription/actions";
import { landingPrimaryButtonClassName } from "@/features/admin/components/button-styles";

export function CheckoutSuccessSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await finalizeCheckoutSessionAction(sessionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.replace("/dashboard");
      router.refresh();
    });
  }, [sessionId, router]);

  return (
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
      {error ? (
        <div className="space-y-2">
          <p className="text-red-700">{error}</p>
          <p>
            Payment may still be processing. Try opening the dashboard in a
            moment, or contact support if access stays blocked.
          </p>
          <a href="/dashboard" className={landingPrimaryButtonClassName}>
            Try dashboard
          </a>
        </div>
      ) : done ? (
        <p>Subscription active — taking you to the dashboard…</p>
      ) : (
        <p>{pending ? "Confirming your subscription…" : "Confirming…"}</p>
      )}
    </div>
  );
}
