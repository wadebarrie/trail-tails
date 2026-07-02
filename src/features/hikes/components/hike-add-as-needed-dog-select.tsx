"use client";

import { addAsNeededDogToDayAction } from "@/features/hikes/actions";
import type { HikePeriod } from "@/features/hikes/hike-period";
import { hikePeriodLabel } from "@/features/hikes/hike-period";

export type AddableAsNeededDog = {
  id: string;
  name: string;
  ownerName: string;
};

export function HikeAddAsNeededDogSelect({
  routeId,
  date,
  period,
  dogs,
}: {
  routeId: string;
  date: string;
  period: HikePeriod;
  dogs: AddableAsNeededDog[];
}) {
  async function add(formData: FormData) {
    const dogId = String(formData.get("dog_id") ?? "");
    if (!dogId) return;
    await addAsNeededDogToDayAction(routeId, date, dogId, period);
  }

  if (!dogs.length) {
    return null;
  }

  const fieldId = `add-as-needed-${routeId}-${period}`;

  return (
    <form action={add} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-stone-700"
        >
          Add as-needed dog ({hikePeriodLabel(period).toLowerCase()})
        </label>
        <select
          id={fieldId}
          name="dog_id"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Select a dog…
          </option>
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name}
              {dog.ownerName ? ` (${dog.ownerName})` : ""}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Add to this day
      </button>
    </form>
  );
}
