"use client";

import { driverActionButtonClassName } from "@/features/admin/components/motion-styles";
import type { DriverBriefingNote } from "@/features/driver-actions/briefing-notes";

type BriefingStop = {
  id: string;
  dogName: string;
  ownerName: string;
  address: string;
  windowLabel: string | null;
};

type DriverDailyBriefingProps = {
  greeting: string;
  routeLabel: string;
  vehicleLabel: string | null;
  dogCount: number;
  estimatedPickupCompletion: string | null;
  notes: DriverBriefingNote[];
  stops: BriefingStop[];
  startLabel: string;
  onStart: () => void;
};

export function DriverDailyBriefing({
  greeting,
  routeLabel,
  vehicleLabel,
  dogCount,
  estimatedPickupCompletion,
  notes,
  stops,
  startLabel,
  onStart,
}: DriverDailyBriefingProps) {
  return (
    <div className="mx-auto max-w-lg">
      <p className="text-2xl font-semibold leading-snug text-white">{greeting}</p>

      <section className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/45">
            Today&apos;s route
          </p>
          <p className="mt-2 text-lg font-medium text-white">{routeLabel}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
            {dogCount} {dogCount === 1 ? "dog" : "dogs"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/45">
            Vehicle
          </p>
          <p className="mt-2 text-lg font-medium text-white">
            {vehicleLabel ?? "Not assigned yet — check with the office"}
          </p>
        </div>

        {estimatedPickupCompletion ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/45">
              Estimated pickup completion
            </p>
            <p className="mt-2 text-xl font-medium tabular-nums text-white">
              {estimatedPickupCompletion}
            </p>
          </div>
        ) : null}

        {notes.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/45">
              Today&apos;s notes
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              {notes.map((note) => (
                <li key={note.text} className="flex gap-2">
                  <span className="text-white/40" aria-hidden>
                    •
                  </span>
                  <span>{note.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {stops.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/45">
              Stops before you start
            </p>
            <ol className="mt-3 space-y-3">
              {stops.map((stop, index) => (
                <li key={stop.id} className="text-sm text-white/90">
                  <p className="font-medium">
                    {index + 1}. {stop.dogName}
                    <span className="font-normal text-white/70">
                      {" "}
                      · {stop.ownerName}
                    </span>
                  </p>
                  <p className="text-white/70">{stop.address}</p>
                  {stop.windowLabel ? (
                    <p className="text-white/60">{stop.windowLabel}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <p className="mt-4 text-sm text-white/70">
        {startLabel.replace(/→/g, "").trim()} opens your stop list. Customer
        texts go out later, when you tap En route, Picked up, or Dropped off —
        not from this button.
      </p>

      <button
        type="button"
        onClick={onStart}
        className={`mt-8 w-full rounded-2xl bg-amber-400 py-5 text-lg font-semibold text-stone-900 ${driverActionButtonClassName}`}
      >
        {startLabel}
      </button>
    </div>
  );
}
