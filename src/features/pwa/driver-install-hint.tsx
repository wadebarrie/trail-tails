"use client";

import { useSyncExternalStore } from "react";

const DISMISS_KEY = "packroute-driver-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot(): boolean {
  if (isStandalone()) return false;
  try {
    if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  } catch {
    /* private mode */
  }
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

export function DriverInstallHint() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">Install PackRoute on your home screen</p>
          <p className="mt-1 text-sm text-white/70">
            {isIos() ? (
              <>
                Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for a
                full-screen driver app.
              </>
            ) : (
              <>
                Use your browser menu → <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-sm text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
