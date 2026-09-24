"use client";

import { useRef, useState, useTransition } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { selectClassName } from "@/features/admin/components/form-styles";
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function add(formData: FormData) {
    const dogId = String(formData.get("dog_id") ?? "");
    if (!dogId || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await addAsNeededDogToDayAction(routeId, date, dogId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  if (!dogs.length) {
    return null;
  }

  return (
    <form ref={formRef} action={add} className="flex flex-wrap items-end gap-2">
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
          disabled={pending}
          className={`mt-1 ${selectClassName}`}
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
        disabled={pending}
        className={secondaryButtonClassName}
      >
        {pending ? "Adding…" : "Add to this day"}
      </button>
      {error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
