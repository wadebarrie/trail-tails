"use client";

import { useCallback, useEffect, useState } from "react";

export type GeolocationServiceStatus =
  | "checking"
  | "unsupported"
  | "denied"
  | "prompt"
  | "waiting"
  | "active";

export function useGeolocationStatus(enabled = true) {
  const [liveStatus, setLiveStatus] =
    useState<GeolocationServiceStatus>("checking");

  const probe = useCallback(() => {
    if (!enabled) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLiveStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setLiveStatus("active"),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLiveStatus("denied");
        } else {
          setLiveStatus("waiting");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      queueMicrotask(() => setLiveStatus("unsupported"));
      return;
    }

    let cancelled = false;
    let removePermissionListener: (() => void) | undefined;

    void (async () => {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });

        const applyState = () => {
          if (cancelled) return;
          if (result.state === "denied") {
            setLiveStatus("denied");
          } else if (result.state === "prompt") {
            setLiveStatus("prompt");
          } else {
            probe();
          }
        };

        applyState();
        result.addEventListener("change", applyState);
        removePermissionListener = () =>
          result.removeEventListener("change", applyState);
      } catch {
        if (!cancelled) probe();
      }
    })();

    const onVisible = () => {
      if (document.visibilityState === "visible") probe();
    };
    document.addEventListener("visibilitychange", onVisible);

    const intervalId = window.setInterval(probe, 30000);

    return () => {
      cancelled = true;
      removePermissionListener?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(intervalId);
    };
  }, [enabled, probe]);

  const status: GeolocationServiceStatus = enabled ? liveStatus : "checking";

  return { status, recheck: probe };
}
