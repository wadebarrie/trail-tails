"use client";

import { useEffect, useState } from "react";

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

export function DriverInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
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
