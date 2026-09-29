"use client";

import { useState } from "react";
import type { AddableDog } from "@/features/routes/components/route-add-dog-select";

export function RouteCreateDogPicker({ dogs }: { dogs: AddableDog[] }) {
  const unassignedIds = dogs
    .filter((d) => !d.currentRouteName)
    .map((d) => d.id);
  const [selected, setSelected] = useState<string[]>(unassignedIds);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((d) => d !== id)
    );
  }

  if (!dogs.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">No dogs to add yet</p>
        <p className="mt-1 text-xs text-amber-800">
          Add a customer and dog in onboarding first, then come back — or create
          this PackRoute now and assign dogs later.
        </p>
      </div>
    );
  }

  return (
    <fieldset className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <legend className="px-1 text-sm font-medium text-stone-800">
        Dogs in this zone
      </legend>
      <p className="mb-3 text-xs text-stone-500">
        Select who rides this PackRoute. Unassigned dogs are checked by default
        — you can change pickup order on the card after saving.
      </p>
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {dogs.map((dog) => {
          const checked = selected.includes(dog.id);
          return (
            <li key={dog.id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  name="dog_ids"
                  value={dog.id}
                  checked={checked}
                  onChange={(e) => toggle(dog.id, e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">{dog.name}</span>
                  {dog.ownerName ? (
                    <span className="text-stone-500"> ({dog.ownerName})</span>
                  ) : null}
                  <span className="block text-xs text-stone-500">
                    {dog.currentRouteName
                      ? `Currently on ${dog.currentRouteName}`
                      : "Unassigned"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
