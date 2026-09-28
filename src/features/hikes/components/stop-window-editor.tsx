"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TimePickerField } from "@/features/admin/components/time-picker-field";
import { toTimeInputValue } from "@/features/admin/components/picker-format";
import { updateStopWindowAction } from "@/features/hikes/actions";
import { formatWindowRange } from "@/lib/dates";

export function StopWindowEditor({
  stopId,
  windowStart,
  windowEnd,
  optional = false,
  label = "Pickup time today",
  allowSaveAsDogDefault = true,
}: {
  stopId: string;
  windowStart: string | null;
  windowEnd: string | null;
  optional?: boolean;
  label?: string;
  /** When true (pickup stops), offer saving onto the dog’s usual pickup time. */
  allowSaveAsDogDefault?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(toTimeInputValue(windowStart, "15:00"));
  const [end, setEnd] = useState(toTimeInputValue(windowEnd, "15:30"));
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!editing) {
      setStart(toTimeInputValue(windowStart, "15:00"));
      setEnd(toTimeInputValue(windowEnd, "15:30"));
    }
  }, [windowStart, windowEnd, editing]);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateStopWindowAction(
        stopId,
        optional && !start.trim() && !end.trim() ? null : start,
        optional && !start.trim() && !end.trim() ? null : end,
        { saveAsDogDefault: allowSaveAsDogDefault && saveAsDefault }
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setSaveAsDefault(false);
      router.refresh();
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
      setSaveAsDefault(false);
      router.refresh();
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
        <p className="text-xs text-stone-400">
          Just for this day — check the box below if you also want to update
          their usual pickup time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-stone-500">
        From
        <TimePickerField
          value={start}
          onChange={setStart}
          className="mt-1 min-w-[8.5rem]"
        />
      </label>
      <label className="text-xs text-stone-500">
        To
        <TimePickerField
          value={end}
          onChange={setEnd}
          className="mt-1 min-w-[8.5rem]"
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
          Clear time
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setStart(toTimeInputValue(windowStart, "15:00"));
          setEnd(toTimeInputValue(windowEnd, "15:30"));
          setSaveAsDefault(false);
          setError(null);
        }}
        className="text-xs text-stone-500 hover:text-stone-700"
      >
        Cancel
      </button>
      {allowSaveAsDogDefault ? (
        <label className="flex w-full items-center gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-stone-300"
          />
          Also update their usual pickup time
        </label>
      ) : null}
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
