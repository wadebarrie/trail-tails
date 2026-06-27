"use client";

import { useActionState } from "react";
import { ScheduleDaysField } from "@/features/dogs/components/schedule-days-field";
import { createRouteAction, updateRouteAction } from "@/features/routes/actions";
import { SubmitButton } from "@/features/admin/components/ui";

function RouteFormFields({
  defaultName = "",
  defaultDays = [] as number[],
  submitLabel,
  pending,
}: {
  defaultName?: string;
  defaultDays?: number[];
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
          placeholder="e.g. Vancouver"
          className="mt-1 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
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
}: {
  routeId: string;
  defaultName: string;
  defaultDays: number[];
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
        submitLabel="Save route"
        pending={pending}
      />
    </form>
  );
}
