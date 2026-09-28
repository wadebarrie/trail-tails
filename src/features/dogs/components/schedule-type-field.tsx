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
            <span className="font-medium">Every week</span>
            <span className="mt-0.5 block text-stone-500">
              Comes on the same days each week on their route.
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
            <span className="font-medium">Only when booked</span>
            <span className="mt-0.5 block text-stone-500">
              Add them to Today or Tomorrow when a customer books a day.
            </span>
          </span>
        </label>
      </div>
      <input type="hidden" name="schedule_type" value={value} />
    </div>
  );
}
