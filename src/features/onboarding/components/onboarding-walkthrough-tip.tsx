"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const TIP_KEY = "packroute.onboarding.walkthroughTipDismissed";

function readTipVisible(): boolean {
  try {
    return window.localStorage.getItem(TIP_KEY) !== "1";
  } catch {
    return true;
  }
}

export function OnboardingWalkthroughTip({
  companyName,
}: {
  companyName: string;
}) {
  const [epoch, setEpoch] = useState(0);
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);
  const getSnapshot = useCallback(() => {
    void epoch;
    return readTipVisible();
  }, [epoch]);

  const visible = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (!visible) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(TIP_KEY, "1");
    } catch {
      // ignore
    }
    setEpoch((n) => n + 1);
  }

  return (
    <aside className="relative rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-12">
      <p className="text-sm font-medium text-stone-900">How this works</p>
      <p className="mt-1 text-sm text-stone-600">
        We&apos;ll walk through a vehicle, driver, customer, dog, PackRoute, and
        company defaults for {companyName} — enough to run a day. You can refine
        everything later.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200 hover:text-stone-800"
        aria-label="Dismiss tip"
      >
        Got it
      </button>
    </aside>
  );
}
