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
import { useAutoArrival, type GeoWatchStatus } from "@/features/driver-actions/use-auto-arrival";
import { formatTime } from "@/lib/dates";
import { formatDistanceMeters } from "@/lib/geo";
import type { DriverStopView } from "@/features/driver-actions/queries";
import type { StopStatus, StopType } from "@/types";

function getStepState(status: StopStatus): {
  completedSteps: number;
  activeStep: number | null;
} {
  switch (status) {
    case "scheduled":
      return { completedSteps: 0, activeStep: null };
    case "en_route":
      return { completedSteps: 1, activeStep: 1 };
    case "arrived":
      return { completedSteps: 2, activeStep: 2 };
    case "picked_up":
    case "dropped_off":
      return { completedSteps: 3, activeStep: null };
    default:
      return { completedSteps: 0, activeStep: null };
  }
}

function TravelConnector({
  progress,
  complete,
}: {
  progress: number | null;
  complete: boolean;
}) {
  const TICKS = 6;

  if (complete) {
    return (
      <div
        className="mx-1 mt-3.5 h-0.5 min-w-3 flex-1 rounded-full bg-green-500/40 sm:mx-2"
        aria-hidden
      />
    );
  }

  const pct = progress ?? 0;

  return (
    <div
      className="relative mx-1 mt-3.5 min-w-3 flex-1 sm:mx-2"
      aria-hidden
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Travel progress to destination"
    >
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400/90 to-sky-400/90 transition-[width] duration-300 ease-linear"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
        {Array.from({ length: TICKS }, (_, i) => {
          const tickAt = (i + 1) / (TICKS + 1);
          const lit = pct >= tickAt - 0.05;
          return (
            <div
              key={i}
              className={`absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${
                lit ? "bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" : "bg-white/25"
              }`}
              style={{ left: `${tickAt * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function locationStatusMessage(status: GeoWatchStatus): string | null {
  switch (status) {
    case "requesting":
      return "Acquiring GPS signal…";
    case "denied":
      return "Location blocked — enable in browser settings, then refresh";
    case "unavailable":
      return "GPS unavailable — open the app when you arrive or tap Mark arrived";
    default:
      return null;
  }
}

function StopProgressSteps({
  stopType,
  status,
  readOnly = false,
  travelProgress = null,
}: {
  stopType: StopType;
  status: StopStatus;
  readOnly?: boolean;
  travelProgress?: number | null;
}) {
  const completeLabel = stopType === "pickup" ? "Picked Up" : "Dropped Off";
  const steps = ["En Route", "Arrived", completeLabel];
  const { completedSteps, activeStep } = readOnly
    ? { completedSteps: 0, activeStep: null }
    : getStepState(status);

  return (
    <nav
      aria-label="Stop progress"
      className="mt-4 border-t border-white/10 pt-4"
    >
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isComplete = index < completedSteps;
          const isCurrent = activeStep !== null && index === activeStep;
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
                        ? index === 1
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
                index === 0 && status === "en_route" ? (
                  <TravelConnector
                    progress={travelProgress}
                    complete={false}
                  />
                ) : (
                  <TravelConnector
                    progress={null}
                    complete={index < completedSteps}
                  />
                )
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

function InfoIconButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-7 !min-h-7 !min-w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 p-0 leading-none text-white/80 transition hover:border-white/40 hover:bg-white/20 hover:text-white active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 11v5" />
        <circle cx="12" cy="8" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

function StopCard({
  stop,
  readOnly = false,
}: {
  stop: DriverStopView;
  readOnly?: boolean;
}) {
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

  const origin =
    stop.originLat != null && stop.originLng != null
      ? { lat: stop.originLat, lng: stop.originLng }
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

  const { canAutoDetect, distanceMetersAway, travelProgress, locationStatus } =
    useAutoArrival({
      stopId: stop.id,
      enabled: stop.status === "en_route" && !pending,
      destination,
      origin,
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">{stop.dogName}</p>
            <InfoIconButton
              onClick={() => setInfoOpen(true)}
              label={`${stop.dogName} — customer info`}
            />
          </div>
          {stop.ownerName ? (
            <p className="mt-0.5 text-sm text-white/60">{stop.ownerName}</p>
          ) : null}
          {stop.address ? (
            <p className="mt-1 text-sm leading-snug text-white/50">{stop.address}</p>
          ) : null}
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

      <StopProgressSteps
        stopType={stop.stopType}
        status={stop.status}
        readOnly={readOnly}
        travelProgress={
          stop.status === "en_route" ? (travelProgress ?? 0) : null
        }
      />

      {!isDone && !readOnly ? (
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
                      : locationStatus === "watching"
                        ? "Auto-detecting arrival via GPS"
                        : "Waiting for GPS…"}
                  </p>
                  {distanceMetersAway != null && !pending ? (
                    <p className="mt-1 text-xs text-sky-200/70">
                      {formatDistanceMeters(distanceMetersAway)} away
                      {travelProgress != null
                        ? ` · ${Math.round(travelProgress * 100)}% of trip`
                        : null}
                    </p>
                  ) : null}
                  {!pending && locationStatus === "watching" ? (
                    <p className="mt-2 text-xs text-sky-200/80">
                      Screen stays awake while driving. If you lock your phone, open
                      PackRoute when you pull up — we&apos;ll grab a fresh GPS fix and
                      mark arrived automatically.
                    </p>
                  ) : null}
                  {locationStatusMessage(locationStatus) && !pending ? (
                    <p className="mt-2 text-xs text-amber-200/90">
                      {locationStatusMessage(locationStatus)}
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
  readOnly?: boolean;
};

export function DriverStopList({
  title,
  stops,
  emptyMessage,
  readOnly = false,
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
            <StopCard key={stop.id} stop={stop} readOnly={readOnly} />
          ))}
        </div>
      )}
    </section>
  );
}
