"use client";

import { useGeolocationStatus } from "@/features/driver-actions/use-geolocation-status";

/** Fixed pill footprint — !min-h-9 overrides global button min-h-11 on mobile */
const PILL_BASE =
  "inline-flex h-9 max-h-9 !min-h-9 min-w-[11.75rem] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border box-border px-3 py-0 text-sm font-medium leading-none";

const LABELS: Record<
  ReturnType<typeof useGeolocationStatus>["status"],
  { label: string; dot: string; pill: string }
> = {
  checking: {
    label: "Checking location…",
    dot: "bg-white/40 animate-pulse",
    pill: "border-white/20 bg-white/5 text-white/60",
  },
  active: {
    label: "Location active",
    dot: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]",
    pill: "border-green-400/30 bg-green-400/10 text-green-100",
  },
  waiting: {
    label: "Acquiring GPS…",
    dot: "bg-amber-400 animate-pulse",
    pill: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  },
  prompt: {
    label: "Location not enabled",
    dot: "bg-amber-400/80",
    pill: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  },
  denied: {
    label: "Location blocked",
    dot: "bg-red-400",
    pill: "border-red-400/30 bg-red-400/10 text-red-100",
  },
  unsupported: {
    label: "GPS unavailable",
    dot: "bg-white/30",
    pill: "border-white/20 bg-white/5 text-white/50",
  },
};

export function LocationServicesIndicator({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  const { status, recheck } = useGeolocationStatus(true);
  const config = LABELS[status];
  const canRetry =
    interactive &&
    (status === "prompt" || status === "denied" || status === "waiting");

  const content = (
    <>
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`}
        aria-hidden
      />
      <span>{config.label}</span>
    </>
  );

  const pillClassName = `${PILL_BASE} ${config.pill}`;

  if (canRetry) {
    return (
      <button
        type="button"
        onClick={recheck}
        className={`${pillClassName} m-0 appearance-none font-inherit transition active:scale-[0.98] md:cursor-pointer`}
        aria-label={`${config.label}. Tap to retry.`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={pillClassName} role="status" aria-live="polite">
      {content}
    </div>
  );
}
