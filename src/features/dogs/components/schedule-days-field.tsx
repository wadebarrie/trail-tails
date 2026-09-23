"use client";

import { useEffect, useState } from "react";
import { WEEKDAYS } from "@/lib/dates";

export function ScheduleDaysField({
  defaultDays = [],
  label = "Expected availability",
  hint = "Typical days this dog is available — not the daily route plan.",
}: {
  defaultDays?: number[];
  label?: string;
  hint?: string;
}) {
  const [selected, setSelected] = useState<number[]>(defaultDays);
  const daysKey = defaultDays.slice().sort().join(",");

  useEffect(() => {
    setSelected(defaultDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount when server days change
  }, [daysKey]);

  function toggle(day: number, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, day].sort() : prev.filter((d) => d !== day)
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-stone-700">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-3">
        {WEEKDAYS.map((day) => (
          <label key={day.value} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(day.value)}
              onChange={(e) => toggle(day.value, e.target.checked)}
            />
            {day.label}
          </label>
        ))}
      </div>
      <input type="hidden" name="schedule_days" value={selected.join(",")} />
    </div>
  );
}
