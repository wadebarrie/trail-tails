"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  arrivedAction,
  completeDropoffAction,
  completePickupAction,
  enRouteAction,
} from "@/features/driver-actions/actions";
import { DriverCustomerInfoSheet } from "@/features/driver-actions/components/driver-customer-info-sheet";
import { useAutoArrival } from "@/features/driver-actions/use-auto-arrival";
import { formatTime } from "@/lib/dates";
import { formatDistanceMeters } from "@/lib/geo";
import type { DriverStopView } from "@/features/driver-actions/queries";
import type { StopStatus, StopType } from "@/types";

function getStepProgress(status: StopStatus): number {
  switch (status) {
    case "scheduled":
      return 0;
    case "en_route":
      return 1;
    case "arrived":
      return 2;
    case "picked_up":
    case "dropped_off":
      return 3;
    default:
      return 0;
  }
}

function StopProgressSteps({
  stopType,
  status,
}: {
  stopType: StopType;
  status: StopStatus;
}) {
  const completeLabel = stopType === "pickup" ? "Picked Up" : "Dropped Off";
  const steps = ["En Route", "Arrived", completeLabel];
  const progress = getStepProgress(status);

  return (
    <nav
      aria-label="Stop progress"
      className="mt-4 border-t border-white/10 pt-4"
    >
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isComplete = progress > index;
          const isCurrent = progress === index;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={`flex items-start ${isLast ? "shrink-0" : "min-w-0 flex-1"}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isComplete
                      ? "bg-green-500/30 text-green-200"
                      : isCurrent
                        ? index === 0
                          ? "bg-amber-400 text-stone-900 ring-2 ring-amber-200/60"
                          : index === 1
                            ? "bg-sky-400 text-stone-900 ring-2 ring-sky-200/60"
                            : "bg-white text-[var(--color-trail-800)] ring-2 ring-white/60"
                        : "bg-white/10 text-white/35"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <span
                  className={`mt-1.5 max-w-[4.5rem] text-center text-[10px] leading-tight font-medium sm:max-w-none sm:text-xs ${
                    isComplete
                      ? "text-green-200/90"
                      : isCurrent
                        ? "text-white"
                        : "text-white/35"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast ? (
                <div
                  className={`mx-1 mt-3.5 h-0.5 min-w-3 flex-1 rounded-full sm:mx-2 ${
                    progress > index ? "bg-green-500/40" : "bg-white/10"
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function getLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function StopCard({ stop }: { stop: DriverStopView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [infoOpen, setInfoOpen] = useState(false);

  const isPickup = stop.stopType === "pickup";
  const isDone =
    stop.status === "picked_up" || stop.status === "dropped_off";

  const destination =
    stop.destinationLat != null && stop.destinationLng != null
      ? { lat: stop.destinationLat, lng: stop.destinationLng }
      : null;

  function refresh() {
    router.refresh();
  }

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        alert(result.error);
      }
      refresh();
    });
  }

  const handleArrived = useCallback(() => {
    run(async () => {
      const coords = await getLocation();
      return arrivedAction(stop.id, coords?.lat ?? null, coords?.lng ?? null);
    });
  }, [stop.id]);

  const { canAutoDetect, distanceMetersAway } = useAutoArrival({
    enabled: stop.status === "en_route" && !pending,
    destination,
    onArrive: handleArrived,
  });

  function handleEnRoute() {
    run(async () => {
      const coords = await getLocation();
      return enRouteAction(stop.id, coords?.lat ?? null, coords?.lng ?? null);
    });
  }

  function handleComplete() {
    run(async () =>
      isPickup
        ? completePickupAction(stop.id)
        : completeDropoffAction(stop.id)
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        isDone
          ? "border-green-500/30 bg-green-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="text-left underline-offset-2 hover:underline"
          >
            <p className="text-xl font-semibold">{stop.dogName}</p>
            {stop.ownerName ? (
              <p className="mt-0.5 text-sm text-white/60">{stop.ownerName}</p>
            ) : null}
          </button>
          <p className="mt-1 text-xs text-white/40">
            {formatTime(stop.windowStart)}–{formatTime(stop.windowEnd)}
          </p>
        </div>
        {isDone ? (
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
            Done
          </span>
        ) : null}
      </div>

      <StopProgressSteps stopType={stop.stopType} status={stop.status} />

      {!isDone ? (
        <div className="mt-5 flex flex-col gap-3">
          {stop.status === "scheduled" ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleEnRoute}
              className="w-full rounded-2xl bg-amber-400 py-5 text-lg font-semibold text-stone-900 transition active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? "…" : "En Route"}
            </button>
          ) : stop.status === "en_route" ? (
            <div className="flex flex-col gap-3">
              {canAutoDetect ? (
                <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-4 text-center">
                  <p className="text-sm font-medium text-sky-100">
                    {pending
                      ? "Marking arrived…"
                      : "Auto-detecting arrival via GPS"}
                  </p>
                  {distanceMetersAway != null && !pending ? (
                    <p className="mt-1 text-xs text-sky-200/70">
                      {formatDistanceMeters(distanceMetersAway)} away
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-center text-sm text-amber-200/80">
                  No GPS on file for this address — tap when you arrive
                </p>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={handleArrived}
                className={
                  canAutoDetect
                    ? "w-full rounded-xl py-3 text-sm font-medium text-white/70 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                    : "w-full rounded-2xl bg-sky-400 py-5 text-lg font-semibold text-stone-900 transition active:scale-[0.98] disabled:opacity-50"
                }
              >
                {pending ? "…" : canAutoDetect ? "Mark arrived manually" : "Arrived"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleComplete}
              className="w-full rounded-2xl bg-white py-5 text-lg font-semibold text-[var(--color-trail-800)] transition active:scale-[0.98] disabled:opacity-50"
            >
              {pending
                ? "…"
                : isPickup
                  ? "Picked Up"
                  : "Dropped Off"}
            </button>
          )}
        </div>
      ) : null}

      <DriverCustomerInfoSheet
        stop={stop}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </div>
  );
}

type DriverStopListProps = {
  title: string;
  stops: DriverStopView[];
  emptyMessage: string;
};

export function DriverStopList({
  title,
  stops,
  emptyMessage,
}: DriverStopListProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {stops.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/20 px-4 py-8 text-center text-white/50">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {stops.map((stop) => (
            <StopCard key={stop.id} stop={stop} />
          ))}
        </div>
      )}
    </section>
  );
}
