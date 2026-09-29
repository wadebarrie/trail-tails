"use client";

import Link from "next/link";
import {
  ONBOARDING_PATH,
  onboardingStepLabel,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/features/onboarding/constants";

/** Core setup steps shown in the progress nav (excludes welcome / done). */
export const ONBOARDING_PROGRESS_STEPS = [
  "vehicle",
  "driver",
  "customer",
  "dog",
  "route",
  "company",
] as const;

export type OnboardingProgressStepId =
  (typeof ONBOARDING_PROGRESS_STEPS)[number];

function isProgressStep(step: OnboardingStepId): step is OnboardingProgressStepId {
  return (ONBOARDING_PROGRESS_STEPS as readonly string[]).includes(step);
}

function stepCompleted(
  step: OnboardingProgressStepId,
  progress: OnboardingProgress
): boolean {
  switch (step) {
    case "vehicle":
      return progress.hasVehicle;
    case "driver":
      return progress.hasDriver;
    case "customer":
      return progress.hasCustomer;
    case "dog":
      return progress.hasDog;
    case "route":
      return progress.hasRoute;
    case "company":
      return progress.hasCompanyInfo;
  }
}

export function OnboardingProgressNav({
  current,
  progress,
}: {
  current: OnboardingStepId;
  progress: OnboardingProgress;
}) {
  if (current === "welcome") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Setup overview
        </p>
        <p className="mt-1 text-lg font-semibold text-stone-900">
          {ONBOARDING_PROGRESS_STEPS.length} steps to your first day
        </p>
        <ol className="mt-3 space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
          {ONBOARDING_PROGRESS_STEPS.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-2 text-sm text-stone-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                {i + 1}
              </span>
              {onboardingStepLabel(step)}
              {stepCompleted(step, progress) ? (
                <span className="text-xs font-medium text-emerald-700">Done</span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (current === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Setup complete
        </p>
        <p className="mt-1 text-lg font-semibold text-emerald-950">
          All {ONBOARDING_PROGRESS_STEPS.length} steps finished
        </p>
      </div>
    );
  }

  if (!isProgressStep(current)) return null;

  const currentIndex = ONBOARDING_PROGRESS_STEPS.indexOf(current);
  const stepNumber = currentIndex + 1;
  const total = ONBOARDING_PROGRESS_STEPS.length;
  const pct = Math.round((stepNumber / total) * 100);

  return (
    <nav
      className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
      aria-label="Setup progress"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-trail-700)]">
            Step {stepNumber} of {total}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-stone-900">
            {onboardingStepLabel(current)}
          </p>
        </div>
        <p className="text-sm font-medium text-stone-500" aria-hidden>
          {pct}%
        </p>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100"
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${stepNumber} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-trail-600)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Mobile: vertical list */}
      <ol className="mt-4 space-y-0 sm:hidden">
        {ONBOARDING_PROGRESS_STEPS.map((step, i) => {
          const done = stepCompleted(step, progress) || i < currentIndex;
          const active = step === current;
          const reachable = done || active || i <= currentIndex;
          return (
            <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
              {i < ONBOARDING_PROGRESS_STEPS.length - 1 ? (
                <span
                  className={`absolute top-7 left-[13px] h-[calc(100%-1.25rem)] w-0.5 ${
                    done || active
                      ? "bg-[var(--color-trail-600)]"
                      : "bg-stone-200"
                  }`}
                  aria-hidden
                />
              ) : null}
              <StepMarker done={done} active={active} index={i} />
              <div className="min-w-0 flex-1 pt-0.5">
                {reachable ? (
                  <Link
                    href={`${ONBOARDING_PATH}?step=${step}`}
                    className={`block text-sm font-medium ${
                      active
                        ? "text-stone-900"
                        : done
                          ? "text-emerald-800 hover:underline"
                          : "text-stone-700 hover:underline"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    {onboardingStepLabel(step)}
                    {active ? (
                      <span className="ml-2 text-xs font-semibold text-[var(--color-trail-700)]">
                        You are here
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="block text-sm font-medium text-stone-400">
                    {onboardingStepLabel(step)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal steps */}
      <ol className="mt-4 hidden sm:grid sm:grid-cols-6 sm:gap-2">
        {ONBOARDING_PROGRESS_STEPS.map((step, i) => {
          const done = stepCompleted(step, progress) || i < currentIndex;
          const active = step === current;
          const reachable = done || active || i <= currentIndex;
          const label = onboardingStepLabel(step);
          const inner = (
            <>
              <StepMarker done={done} active={active} index={i} />
              <span
                className={`mt-1.5 block text-center text-xs font-medium leading-tight ${
                  active
                    ? "text-stone-900"
                    : done
                      ? "text-emerald-800"
                      : "text-stone-400"
                }`}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={step} className="flex flex-col items-center">
              {reachable ? (
                <Link
                  href={`${ONBOARDING_PATH}?step=${step}`}
                  className="flex w-full flex-col items-center rounded-lg px-1 py-1 hover:bg-stone-50"
                  aria-current={active ? "step" : undefined}
                  title={active ? `${label} (current)` : label}
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex w-full flex-col items-center px-1 py-1">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepMarker({
  done,
  active,
  index,
}: {
  done: boolean;
  active: boolean;
  index: number;
}) {
  return (
    <span
      className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active
          ? "bg-[var(--color-trail-700)] text-white ring-4 ring-[var(--color-trail-100)]"
          : done
            ? "bg-emerald-600 text-white"
            : "bg-stone-100 text-stone-500 ring-1 ring-stone-200"
      }`}
      aria-hidden
    >
      {done && !active ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        index + 1
      )}
    </span>
  );
}
