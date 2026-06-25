"use client";

import { addDogToRouteAction } from "@/features/routes/actions";

export type AddableDog = {
  id: string;
  name: string;
  ownerName: string;
  currentRouteName?: string;
};

export function RouteAddDogSelect({
  routeId,
  dogs,
}: {
  routeId: string;
  dogs: AddableDog[];
}) {
  async function add(formData: FormData) {
    const dogId = String(formData.get("dog_id") ?? "");
    if (!dogId) return;
    await addDogToRouteAction(routeId, dogId);
  }

  if (!dogs.length) {
    return (
      <p className="text-sm text-stone-500">
        Every active dog is already on this route.
      </p>
    );
  }

  return (
    <form action={add} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1">
        <label
          htmlFor={`add-dog-${routeId}`}
          className="block text-sm font-medium text-stone-700"
        >
          Add dog
        </label>
        <select
          id={`add-dog-${routeId}`}
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
              {dog.currentRouteName
                ? ` — on ${dog.currentRouteName}`
                : " — unassigned"}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Add
      </button>
    </form>
  );
}
