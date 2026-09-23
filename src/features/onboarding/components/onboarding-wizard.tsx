"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  completeOnboardingAction,
  dismissOnboardingAction,
  onboardingCreateVehicleAction,
  onboardingEnableSelfAsHikerAction,
  onboardingSaveCompanyInfoAction,
} from "@/features/onboarding/actions";
import { OnboardingSupportCard } from "@/features/onboarding/components/onboarding-support-card";
import {
  ONBOARDING_PATH,
  onboardingStepLabel,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/features/onboarding/constants";
import { SubmitButton } from "@/features/admin/components/ui";
import { TimePickerField } from "@/features/admin/components/time-picker-field";
import {
  landingPrimaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";

const STEP_ORDER: OnboardingStepId[] = [
  "welcome",
  "vehicle",
  "hiker",
  "customer",
  "dog",
  "route",
  "company",
  "done",
];

function StepDots({ current }: { current: OnboardingStepId }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Setup progress">
      {STEP_ORDER.filter((s) => s !== "welcome" && s !== "done").map((step, i) => {
        const stepIndex = STEP_ORDER.indexOf(step);
        const done = stepIndex < idx;
        const active = step === current;
        return (
          <li
            key={step}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              active
                ? "bg-[var(--color-trail-700)] text-white"
                : done
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-500"
            }`}
          >
            {i + 1}. {onboardingStepLabel(step)}
          </li>
        );
      })}
    </ol>
  );
}

function DoneCheck({ done }: { done: boolean }) {
  return done ? (
    <span className="text-xs font-medium text-emerald-700">Done</span>
  ) : (
    <span className="text-xs text-stone-400">To do</span>
  );
}

export function OnboardingWizard({
  step,
  progress,
  companyName,
  adminCanDrive,
  defaultHikeRateCents,
  nightBeforeReminderTime,
}: {
  step: OnboardingStepId;
  progress: OnboardingProgress;
  companyName: string;
  adminCanDrive: boolean;
  defaultHikeRateCents: number | null;
  nightBeforeReminderTime: string;
}) {
  const [vehicleState, vehicleAction, vehiclePending] = useActionState(
    onboardingCreateVehicleAction,
    {}
  );
  const [companyState, companyAction, companyPending] = useActionState(
    onboardingSaveCompanyInfoAction,
    {}
  );
  const [hikerError, setHikerError] = useState<string | null>(null);
  const [hikerPending, startHiker] = useTransition();
  const [finishPending, startFinish] = useTransition();
  const [dismissPending, startDismiss] = useTransition();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--color-trail-700)]">
          First-run setup
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">
          Set up {companyName}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          We&apos;ll walk through your first vehicle, hiker, customer, dog,
          route, and company defaults — enough to run a morning. You can refine
          everything later.
        </p>
      </div>

      <StepDots current={step} />
      <OnboardingSupportCard />

      {step === "welcome" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">Welcome</h2>
          <p className="text-sm text-stone-600">
            PackRoute works best once you have one truck (or van), at least one
            hiker, a customer with an address, their dog, and a weekday route.
            Takes most teams about 10–15 minutes.
          </p>
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex justify-between gap-3">
              <span>Vehicle</span>
              <DoneCheck done={progress.hasVehicle} />
            </li>
            <li className="flex justify-between gap-3">
              <span>Hiker (driver)</span>
              <DoneCheck done={progress.hasHiker} />
            </li>
            <li className="flex justify-between gap-3">
              <span>Customer</span>
              <DoneCheck done={progress.hasCustomer} />
            </li>
            <li className="flex justify-between gap-3">
              <span>Dog</span>
              <DoneCheck done={progress.hasDog} />
            </li>
            <li className="flex justify-between gap-3">
              <span>Route</span>
              <DoneCheck done={progress.hasRoute} />
            </li>
            <li className="flex justify-between gap-3">
              <span>Company info</span>
              <DoneCheck done={progress.hasCompanyInfo} />
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`${ONBOARDING_PATH}?step=vehicle`}
              className={landingPrimaryButtonClassName}
            >
              Start setup
            </Link>
            <button
              type="button"
              disabled={dismissPending}
              className={secondaryButtonClassName}
              onClick={() =>
                startDismiss(async () => {
                  await dismissOnboardingAction();
                })
              }
            >
              {dismissPending ? "Skipping…" : "Skip for now"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "vehicle" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            1. Add your first vehicle
          </h2>
          <p className="text-sm text-stone-600">
            Hikers pick a van or truck for the morning. A nickname is enough —
            plate and capacity are optional.
          </p>
          {progress.hasVehicle ? (
            <p className="text-sm text-emerald-700">
              You already have a vehicle.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=hiker`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Continue
              </Link>
            </p>
          ) : (
            <form action={vehicleAction} className="space-y-4">
              {vehicleState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {vehicleState.error}
                </p>
              ) : null}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-stone-700"
                >
                  Vehicle name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Blue van"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="plate"
                    className="block text-sm font-medium text-stone-700"
                  >
                    Plate (optional)
                  </label>
                  <input
                    id="plate"
                    name="plate"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="capacity"
                    className="block text-sm font-medium text-stone-700"
                  >
                    Dog capacity (optional)
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <SubmitButton pending={vehiclePending}>
                Save and continue
              </SubmitButton>
            </form>
          )}
        </section>
      ) : null}

      {step === "hiker" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            2. Add a hiker
          </h2>
          <p className="text-sm text-stone-600">
            Hikers use the mobile Today view. As company admin you can enable
            yourself, or add a dedicated hiker login later under Drivers.
          </p>
          {hikerError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {hikerError}
            </p>
          ) : null}
          {progress.hasHiker || adminCanDrive ? (
            <p className="text-sm text-emerald-700">
              Hiker access is ready.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=customer`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Continue
              </Link>
            </p>
          ) : (
            <button
              type="button"
              disabled={hikerPending}
              className={landingPrimaryButtonClassName}
              onClick={() =>
                startHiker(async () => {
                  const result = await onboardingEnableSelfAsHikerAction();
                  if (result?.error) setHikerError(result.error);
                })
              }
            >
              {hikerPending ? "Enabling…" : "Enable me as a hiker"}
            </button>
          )}
          <p className="text-xs text-stone-500">
            Prefer a separate login?{" "}
            <Link
              href={`/dashboard/drivers/new?returnTo=${encodeURIComponent(`${ONBOARDING_PATH}?step=customer`)}`}
              className="font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
            >
              Add a driver
            </Link>
            , then come back here.
          </p>
        </section>
      ) : null}

      {step === "customer" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            3. Add your first customer
          </h2>
          <p className="text-sm text-stone-600">
            Customers need a full street address so we can geocode pickups and
            send ETA texts.
          </p>
          {progress.hasCustomer ? (
            <p className="text-sm text-emerald-700">
              Customer on file.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=dog`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Continue to dog
              </Link>
            </p>
          ) : (
            <Link
              href={`/dashboard/customers/new?returnTo=${encodeURIComponent(`${ONBOARDING_PATH}?step=dog`)}`}
              className={landingPrimaryButtonClassName}
            >
              Add a customer
            </Link>
          )}
        </section>
      ) : null}

      {step === "dog" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            4. Add a dog
          </h2>
          <p className="text-sm text-stone-600">
            Attach a dog to that customer. You can set a recurring route later —
            pickup window is enough for now.
          </p>
          {!progress.hasCustomer ? (
            <p className="text-sm text-amber-800">
              Add a customer first.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=customer`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Go back
              </Link>
            </p>
          ) : progress.hasDog ? (
            <p className="text-sm text-emerald-700">
              Dog on file.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=route`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Continue to route
              </Link>
            </p>
          ) : (
            <Link
              href={`/dashboard/dogs/new?returnTo=${encodeURIComponent(`${ONBOARDING_PATH}?step=route`)}`}
              className={landingPrimaryButtonClassName}
            >
              Add a dog
            </Link>
          )}
        </section>
      ) : null}

      {step === "route" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            5. Create a route
          </h2>
          <p className="text-sm text-stone-600">
            Routes define which weekdays run and stop order. Start with one
            morning route — you can add more later.
          </p>
          {progress.hasRoute ? (
            <p className="text-sm text-emerald-700">
              Route ready.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=company`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Continue to company info
              </Link>
            </p>
          ) : (
            <Link
              href={`/dashboard/route?returnTo=${encodeURIComponent(`${ONBOARDING_PATH}?step=company`)}`}
              className={landingPrimaryButtonClassName}
            >
              Set up a route
            </Link>
          )}
        </section>
      ) : null}

      {step === "company" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            6. Company defaults
          </h2>
          <p className="text-sm text-stone-600">
            Set your default hike price and when customers get the night-before
            reminder. You can change these anytime under Settings.
          </p>
          {progress.hasCompanyInfo ? (
            <p className="text-sm text-emerald-700">
              Company defaults saved.{" "}
              <Link
                href={`${ONBOARDING_PATH}?step=done`}
                className="font-medium underline-offset-2 hover:underline"
              >
                Finish setup
              </Link>
            </p>
          ) : null}
          <form action={companyAction} className="space-y-4">
            {companyState.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {companyState.error}
              </p>
            ) : null}
            <div>
              <label
                htmlFor="default_hike_rate"
                className="block text-sm font-medium text-stone-700"
              >
                Default hike price ($)
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                Used for billing unless a dog has its own rate.
              </p>
              <input
                id="default_hike_rate"
                name="default_hike_rate"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="60.00"
                defaultValue={
                  defaultHikeRateCents != null
                    ? (defaultHikeRateCents / 100).toFixed(2)
                    : ""
                }
                className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="night_before_reminder_time"
                className="block text-sm font-medium text-stone-700"
              >
                Night-before reminder time
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                Local time to text customers about tomorrow&apos;s pickup.
              </p>
              <TimePickerField
                id="night_before_reminder_time"
                name="night_before_reminder_time"
                required
                defaultValue={nightBeforeReminderTime.slice(0, 5)}
                className="mt-2"
              />
            </div>
            <SubmitButton pending={companyPending}>
              Save and finish
            </SubmitButton>
          </form>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">You&apos;re set</h2>
          <p className="text-sm text-stone-600">
            Next: open Today / Tomorrow to confirm stops, then try a driver
            login on your phone. SMS needs Twilio configured — support can help
            if you&apos;re not there yet.
          </p>
          <OnboardingSupportCard compact />
          <button
            type="button"
            disabled={finishPending}
            className={landingPrimaryButtonClassName}
            onClick={() =>
              startFinish(async () => {
                await completeOnboardingAction();
              })
            }
          >
            {finishPending ? "Opening dashboard…" : "Go to dashboard"}
          </button>
        </section>
      ) : null}

      {step !== "welcome" && step !== "done" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={dismissPending}
            className="text-stone-500 underline-offset-2 hover:underline"
            onClick={() =>
              startDismiss(async () => {
                await dismissOnboardingAction();
              })
            }
          >
            Skip setup for now
          </button>
          <Link href="/dashboard/help" className="text-[var(--color-trail-700)] hover:underline">
            Full help guide
          </Link>
        </div>
      ) : null}
    </div>
  );
}
