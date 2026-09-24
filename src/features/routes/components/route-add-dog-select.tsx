"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";
import { selectClassName } from "@/features/admin/components/form-styles";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function add(formData: FormData) {
    const dogId = String(formData.get("dog_id") ?? "");
    if (!dogId || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await addDogToRouteAction(routeId, dogId);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  if (!dogs.length) {
    return (
      <p className="text-sm text-stone-500">
        Every active dog is already on this route.
      </p>
    );
  }

  return (
    <form ref={formRef} action={add} className="flex flex-wrap items-end gap-2">
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
              {dog.currentRouteName
                ? ` — on ${dog.currentRouteName}`
                : " — unassigned"}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className={secondaryButtonClassName}
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
