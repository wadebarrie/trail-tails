"use client";

import { driverActionButtonClassName } from "@/features/admin/components/motion-styles";
import type { DriverBriefingNote } from "@/features/driver-actions/briefing-notes";

type DriverDailyBriefingProps = {
  greeting: string;
  routeLabel: string;
  dogCount: number;
  estimatedPickupCompletion: string | null;
  notes: DriverBriefingNote[];
  onStart: () => void;
};

export function DriverDailyBriefing({
  greeting,
  routeLabel,
  dogCount,
  estimatedPickupCompletion,
  notes,
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
      </section>

      <button
        type="button"
        onClick={onStart}
        className={`mt-8 w-full rounded-2xl bg-amber-400 py-5 text-lg font-semibold text-stone-900 ${driverActionButtonClassName}`}
      >
        Start Morning Route →
      </button>
    </div>
  );
}
