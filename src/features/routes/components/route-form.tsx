"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScheduleDaysField } from "@/features/dogs/components/schedule-days-field";
import { createRouteAction, updateRouteAction } from "@/features/routes/actions";
import type { AddableDog } from "@/features/routes/components/route-add-dog-select";
import { RouteCreateDogPicker } from "@/features/routes/components/route-create-dog-picker";
import type { RouteCadence } from "@/features/company/route-cadence";
import { SubmitButton } from "@/features/admin/components/ui";
import {
  inputClassName,
  selectClassName,
} from "@/features/admin/components/form-styles";
import type { HikePeriod } from "@/features/hikes/hike-period";

function RouteFormFields({
  formKey,
  defaultName = "",
  defaultDays = [] as number[],
  defaultPeriod = "morning" as HikePeriod,
  submitLabel,
  pending,
  dogs,
  routeCadence = "twice",
}: {
  formKey: string;
  defaultName?: string;
  defaultDays?: number[];
  defaultPeriod?: HikePeriod;
  submitLabel: string;
  pending: boolean;
  dogs?: AddableDog[];
  routeCadence?: RouteCadence;
}) {
  const onceDaily = routeCadence === "once";

  return (
    <div key={formKey} className="space-y-4">
      <div>
        <label
          htmlFor="route-name"
          className="block text-sm font-medium text-stone-700"
        >
          Zone name
        </label>
        <input
          id="route-name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          placeholder={onceDaily ? "e.g. North Shore" : "e.g. North Shore Morning"}
          className={`mt-1 max-w-md ${inputClassName}`}
        />
        <p className="mt-1 text-xs text-stone-500">
          Name the area you service — neighbourhood, side of town, or van run.
        </p>
      </div>

      {onceDaily ? (
        <input type="hidden" name="period" value="morning" />
      ) : (
        <div>
          <label
            htmlFor="route-period"
            className="block text-sm font-medium text-stone-700"
          >
            Time of day
          </label>
          <select
            id="route-period"
            name="period"
            defaultValue={defaultPeriod}
            className={`mt-1 max-w-md ${selectClassName}`}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
          <p className="mt-1 text-xs text-stone-500">
            Same zone in the afternoon is a separate PackRoute — different dogs,
            driver, and order.
          </p>
        </div>
      )}

      <ScheduleDaysField
        defaultDays={defaultDays}
        label="Schedule days"
        hint="Weekdays this PackRoute runs."
      />

      {dogs ? <RouteCreateDogPicker dogs={dogs} /> : null}

      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </div>
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
          PackRoute saved.
        </p>
      ) : null}
    </>
  );
}

function useRefreshOnOk(ok: boolean | undefined) {
  const router = useRouter();
  const seen = useRef(false);
  useEffect(() => {
    if (!ok) {
      seen.current = false;
      return;
    }
    if (seen.current) return;
    seen.current = true;
    router.refresh();
  }, [ok, router]);
}

export function CreateRouteForm({
  dogs = [],
  routeCadence = "twice",
}: {
  dogs?: AddableDog[];
  routeCadence?: RouteCadence;
}) {
  const [state, formAction, pending] = useActionState(
    createRouteAction,
    {} as { error?: string; ok?: boolean }
  );
  useRefreshOnOk(state.ok);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessages state={state} />
      <RouteFormFields
        formKey={`create-${state.ok ? "saved" : "new"}`}
        submitLabel="Create PackRoute"
        pending={pending}
        dogs={dogs}
        routeCadence={routeCadence}
      />
    </form>
  );
}

export function EditRouteForm({
  routeId,
  defaultName,
  defaultDays,
  defaultPeriod,
  routeCadence = "twice",
}: {
  routeId: string;
  defaultName: string;
  defaultDays: number[];
  defaultPeriod: HikePeriod;
  routeCadence?: RouteCadence;
}) {
  const boundUpdate = updateRouteAction.bind(null, routeId);
  const [state, formAction, pending] = useActionState(
    boundUpdate,
    {} as { error?: string; ok?: boolean }
  );
  useRefreshOnOk(state.ok);

  const formKey = `${routeId}-${defaultName}-${defaultPeriod}-${defaultDays.slice().sort().join(",")}`;

  return (
    <form action={formAction} className="space-y-4">
      <FormMessages state={state} />
      <RouteFormFields
        formKey={formKey}
        defaultName={defaultName}
        defaultDays={defaultDays}
        defaultPeriod={defaultPeriod}
        submitLabel="Save PackRoute"
        pending={pending}
        routeCadence={routeCadence}
      />
    </form>
  );
}
