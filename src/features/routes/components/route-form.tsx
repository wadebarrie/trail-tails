"use client";

import { useActionState } from "react";
import { ScheduleDaysField } from "@/features/dogs/components/schedule-days-field";
import { createRouteAction, updateRouteAction } from "@/features/routes/actions";
import { SubmitButton } from "@/features/admin/components/ui";
import type { HikePeriod } from "@/features/hikes/hike-period";

function RouteFormFields({
  defaultName = "",
  defaultDays = [] as number[],
  defaultPeriod = "morning" as HikePeriod,
  submitLabel,
  pending,
}: {
  defaultName?: string;
  defaultDays?: number[];
  defaultPeriod?: HikePeriod;
  submitLabel: string;
  pending: boolean;
}) {
  return (
    <>
      <div>
        <label
          htmlFor="route-name"
          className="block text-sm font-medium text-stone-700"
        >
          Route name
        </label>
        <input
          id="route-name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          placeholder="e.g. North Van Morning"
          className="mt-1 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="route-period"
          className="block text-sm font-medium text-stone-700"
        >
          Walk time
        </label>
        <select
          id="route-period"
          name="period"
          defaultValue={defaultPeriod}
          className="mt-1 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
        </select>
        <p className="mt-1 text-xs text-stone-500">
          Morning and afternoon walks are separate routes — different dogs,
          drivers, and schedules.
        </p>
      </div>

      <ScheduleDaysField defaultDays={defaultDays} />

      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </>
  );
}

function FormMessages({ state }: { state: { error?: string; ok?: boolean } }) {
  return (
    <>
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved.
        </p>
      ) : null}
    </>
  );
}

export function CreateRouteForm() {
  const [state, formAction, pending] = useActionState(
    createRouteAction,
    {} as { error?: string; ok?: boolean }
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormMessages state={state} />
      <RouteFormFields submitLabel="Add route" pending={pending} />
    </form>
  );
}

export function EditRouteForm({
  routeId,
  defaultName,
  defaultDays,
  defaultPeriod,
}: {
  routeId: string;
  defaultName: string;
  defaultDays: number[];
  defaultPeriod: HikePeriod;
}) {
  const boundUpdate = updateRouteAction.bind(null, routeId);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    {} as { error?: string; ok?: boolean }
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormMessages state={state} />
      <RouteFormFields
        defaultName={defaultName}
        defaultDays={defaultDays}
        defaultPeriod={defaultPeriod}
        submitLabel="Save route"
        pending={pending}
      />
    </form>
  );
}
