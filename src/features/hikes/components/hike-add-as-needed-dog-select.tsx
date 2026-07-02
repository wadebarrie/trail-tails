"use client";

import { addAsNeededDogToDayAction } from "@/features/hikes/actions";

export type AddableAsNeededDog = {
  id: string;
  name: string;
  ownerName: string;
};

export function HikeAddAsNeededDogSelect({
  routeId,
  date,
  dogs,
}: {
  routeId: string;
  date: string;
  dogs: AddableAsNeededDog[];
}) {
  async function add(formData: FormData) {
    const dogId = String(formData.get("dog_id") ?? "");
    if (!dogId) return;
    await addAsNeededDogToDayAction(routeId, date, dogId);
  }

  if (!dogs.length) {
    return null;
  }

  return (
    <form action={add} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1">
        <label
          htmlFor={`add-as-needed-${routeId}`}
          className="block text-sm font-medium text-stone-700"
        >
          Add as-needed dog
        </label>
        <select
          id={`add-as-needed-${routeId}`}
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
