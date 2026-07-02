"use client";

import { useState, useTransition } from "react";
import { updateStopWindowAction } from "@/features/hikes/actions";
import { formatWindowRange } from "@/lib/dates";

export function StopWindowEditor({
  stopId,
  windowStart,
  windowEnd,
  optional = false,
  label = "Planned window",
}: {
  stopId: string;
  windowStart: string | null;
  windowEnd: string | null;
  optional?: boolean;
  label?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(windowStart?.slice(0, 5) ?? "15:00");
  const [end, setEnd] = useState(windowEnd?.slice(0, 5) ?? "15:30");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateStopWindowAction(
        stopId,
        optional && !start.trim() && !end.trim() ? null : start,
        optional && !start.trim() && !end.trim() ? null : end
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  function clearWindow() {
    if (!optional) return;
    setError(null);
    startTransition(async () => {
      const result = await updateStopWindowAction(stopId, null, null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  if (!editing) {
    const range = formatWindowRange(windowStart, windowEnd);
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-stone-700"
        >
          {label}: {range ?? (optional ? "None" : "Not set")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-stone-500">
        From
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="mt-1 block rounded border border-stone-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-xs text-stone-500">
        To
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="mt-1 block rounded border border-stone-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        Save
      </button>
      {optional ? (
        <button
          type="button"
          onClick={clearWindow}
          disabled={pending}
          className="text-xs text-stone-500 hover:text-stone-700 disabled:opacity-50"
        >
          Clear window
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setStart(windowStart?.slice(0, 5) ?? "15:00");
          setEnd(windowEnd?.slice(0, 5) ?? "15:30");
          setError(null);
        }}
        className="text-xs text-stone-500 hover:text-stone-700"
      >
        Cancel
      </button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
