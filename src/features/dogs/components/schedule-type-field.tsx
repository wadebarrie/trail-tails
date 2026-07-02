"use client";

import type { DogScheduleType } from "@/types";

export function ScheduleTypeField({
  value,
  onChange,
}: {
  value: DogScheduleType;
  onChange: (type: DogScheduleType) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-stone-700">Schedule type</p>
      <div className="mt-2 space-y-2">
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="schedule_type_ui"
            value="recurring"
            checked={value === "recurring"}
            onChange={() => onChange("recurring")}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Recurring</span>
            <span className="mt-0.5 block text-stone-500">
              Default route assignment and expected availability. The daily route
              plan on Today/Tomorrow is adjusted separately.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input
            type="radio"
            name="schedule_type_ui"
            value="as_needed"
            checked={value === "as_needed"}
            onChange={() => onChange("as_needed")}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">As-needed</span>
            <span className="mt-0.5 block text-stone-500">
              Add this dog to hike days manually when booked.
            </span>
          </span>
        </label>
      </div>
      <input type="hidden" name="schedule_type" value={value} />
    </div>
  );
}
