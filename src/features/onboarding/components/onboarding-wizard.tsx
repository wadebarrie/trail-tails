"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  dismissOnboardingAction,
  completeOnboardingAction,
  onboardingCreateCustomerAction,
  onboardingCreateDogAction,
  onboardingCreateRouteAction,
  onboardingCreateSampleInvoiceAction,
  onboardingSaveCompanyInfoAction,
  onboardingSaveWelcomeAction,
  onboardingSendSampleTextAction,
  onboardingUploadSamplePhotoAction,
} from "@/features/onboarding/actions";
import { OnboardingSupportCard } from "@/features/onboarding/components/onboarding-support-card";
import { OnboardingCsvImportCallout } from "@/features/onboarding/components/onboarding-csv-import-callout";
import { OnboardingProgressNav } from "@/features/onboarding/components/onboarding-progress-nav";
import {
  ONBOARDING_PATH,
  type OnboardingProgress,
  type OnboardingRouteCadence,
  type OnboardingStepId,
} from "@/features/onboarding/constants";
import {
  firstValueChecklist,
  sampleReminderPreview,
  wizardSmsExplanation,
  type OutingStyle,
  type WizardSmsMode,
} from "@/features/onboarding/first-value";
import { TimePickerField } from "@/features/admin/components/time-picker-field";
import {
  landingPrimaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { inputClassName } from "@/features/admin/components/form-styles";
import { Card } from "@/features/admin/components/ui";
import { trackEvent } from "@/features/landing/analytics";

function ChoiceButton({
  selected,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
        selected
          ? "border-[var(--color-trail-600)] bg-[var(--color-trail-50)] ring-2 ring-[var(--color-trail-600)]"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <span className="font-semibold text-stone-900">{title}</span>
      <span className="mt-1 block text-xs text-stone-600">{detail}</span>
    </button>
  );
}

export function OnboardingWizard({
  step,
  progress,
  companyName,
  ownerName,
  ownerPhone,
  dogId,
  dogName,
  smsMode,
  defaultHikeRateCents,
  nightBeforeReminderTime,
  initialRouteCadence,
  initialOutingStyle,
  trialEndsOn,
  galleryUrl,
  invoiceId,
}: {
  step: OnboardingStepId;
  progress: OnboardingProgress;
  companyName: string;
  ownerName: string;
  ownerPhone: string;
  dogId: string | null;
  dogName: string | null;
  smsMode: WizardSmsMode;
  defaultHikeRateCents: number | null;
  nightBeforeReminderTime: string;
  initialRouteCadence: OnboardingRouteCadence | null;
  initialOutingStyle: OutingStyle | null;
  trialEndsOn: string | null;
  galleryUrl: string | null;
  invoiceId: string | null;
}) {
  const [welcomeState, welcomeAction, welcomePending] = useActionState(
    onboardingSaveWelcomeAction,
    {}
  );
  const [customerState, customerAction, customerPending] = useActionState(
    onboardingCreateCustomerAction,
    {}
  );
  const [dogState, dogAction, dogPending] = useActionState(
    onboardingCreateDogAction,
    {}
  );
  const [routeState, routeAction, routePending] = useActionState(
    onboardingCreateRouteAction,
    {}
  );
  const [companyState, companyAction, companyPending] = useActionState(
    onboardingSaveCompanyInfoAction,
    {}
  );
  const [textState, textAction, textPending] = useActionState(
    onboardingSendSampleTextAction,
    {}
  );
  const [photoState, photoAction, photoPending] = useActionState(
    onboardingUploadSamplePhotoAction,
    {}
  );
  const [finishPending, startFinish] = useTransition();
  const [dismissPending, startDismiss] = useTransition();
  const [dismissError, setDismissError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoicePending, startInvoice] = useTransition();
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(invoiceId);
  const [outing, setOuting] = useState<OutingStyle>(initialOutingStyle ?? "hike");
  const [cadence, setCadence] = useState<OnboardingRouteCadence>(
    initialRouteCadence ?? "once"
  );

  useEffect(() => {
    trackEvent("onboarding_step", { step });
  }, [step]);

  const preview =
    textState.preview ??
    sampleReminderPreview({
      ownerName,
      dogName,
    });
  const openGallery = photoState.galleryUrl ?? galleryUrl;
  const checklist = firstValueChecklist(progress);
  const outingWord = outing === "walk" ? "walk" : "hike";

  function snooze() {
    setDismissError(null);
    startDismiss(async () => {
      const result = await dismissOnboardingAction();
      if (result?.error) setDismissError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--color-trail-700)]">
          First-run setup
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Set up {companyName}
        </h1>
      </div>

      <OnboardingProgressNav current={step} progress={progress} />

      {step === "welcome" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Get to a first {outingWord} today
          </h2>
          {trialEndsOn ? (
            <p className="text-sm font-medium text-[var(--color-trail-800)]">
              Your trial ends on {trialEndsOn}.
            </p>
          ) : null}
          <p className="text-sm text-stone-600">
            Add one customer, their dog, and one route. Then preview a text,
            a photo gallery, and a draft invoice. About 15 minutes.
          </p>
          <form action={welcomeAction} className="space-y-4">
            {welcomeState.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {welcomeState.error}
              </p>
            ) : null}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-800">
                Walking or hiking?
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceButton
                  selected={outing === "walk"}
                  title="Walking"
                  detail="Neighbourhood walks and park loops."
                  onClick={() => setOuting("walk")}
                />
                <ChoiceButton
                  selected={outing === "hike"}
                  title="Hiking"
                  detail="Trail days with a pickup window."
                  onClick={() => setOuting("hike")}
                />
              </div>
              <input type="hidden" name="outing_style" value={outing} />
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-800">
                How many outings a day?
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ChoiceButton
                  selected={cadence === "once"}
                  title="One a day"
                  detail="One route is enough to start."
                  onClick={() => setCadence("once")}
                />
                <ChoiceButton
                  selected={cadence === "twice"}
                  title="Morning and afternoon"
                  detail="You can add the second route later."
                  onClick={() => setCadence("twice")}
                />
              </div>
              <input type="hidden" name="route_cadence" value={cadence} />
            </fieldset>
            <div>
              <label htmlFor="vehicle_name" className="block text-sm font-medium text-stone-700">
                Do you drive a van?
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                Optional. Leave this blank if you are on foot.
              </p>
              <input
                id="vehicle_name"
                name="vehicle_name"
                placeholder="Van nickname, if you use one"
                className={`mt-2 ${inputClassName}`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={welcomePending}
                className={landingPrimaryButtonClassName}
              >
                {welcomePending ? "Saving…" : "Continue"}
              </button>
              <button
                type="button"
                disabled={dismissPending}
                className={secondaryButtonClassName}
                onClick={snooze}
              >
                {dismissPending ? "Snoozing…" : "Skip for now"}
              </button>
            </div>
            {dismissError ? (
              <p className="text-sm text-red-700">{dismissError}</p>
            ) : null}
          </form>
          <OnboardingSupportCard compact />
        </Card>
      ) : null}

      {step === "customer" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Add your first customer
          </h2>
          <p className="text-sm text-stone-600">
            Use yourself as the test customer so the sample text comes to your
            phone. You can add real customers after.
          </p>
          {progress.hasCustomer ? (
            <p className="text-sm text-emerald-700">
              Customer on file.{" "}
              <Link href={`${ONBOARDING_PATH}?step=dog`} className="font-medium underline">
                Continue to dog
              </Link>
            </p>
          ) : (
            <form action={customerAction} className="space-y-3">
              {customerState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {customerState.error}
                </p>
              ) : null}
              <label className="block text-sm font-medium text-stone-700">
                Your name
                <input
                  name="owner_name"
                  required
                  defaultValue={ownerName}
                  className={`mt-1 ${inputClassName}`}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Your mobile
                <input
                  name="phone"
                  type="tel"
                  required
                  defaultValue={ownerPhone}
                  placeholder="+1 604 555 0100"
                  className={`mt-1 ${inputClassName}`}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Pickup address
                <input
                  name="address_line1"
                  required
                  placeholder="Street address"
                  className={`mt-1 ${inputClassName}`}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <input name="city" required placeholder="City" className={inputClassName} />
                <input
                  name="state_province"
                  required
                  placeholder="Province"
                  defaultValue="BC"
                  className={inputClassName}
                />
                <input
                  name="postal_code"
                  required
                  placeholder="Postal code"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={customerPending}
                className={`${landingPrimaryButtonClassName} w-full justify-center text-center`}
              >
                {customerPending ? "Saving…" : "Use me as a test customer"}
              </button>
            </form>
          )}
          <OnboardingCsvImportCallout returnStep="dog" />
        </Card>
      ) : null}

      {step === "dog" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Add a dog</h2>
          <p className="text-sm text-stone-600">
            This dog is attached to your test customer. Pickup defaults to
            8:00–8:30. You can change that later.
          </p>
          {!progress.hasCustomer ? (
            <Link href={`${ONBOARDING_PATH}?step=customer`} className="text-sm font-medium underline">
              Add a customer first
            </Link>
          ) : progress.hasDog ? (
            <p className="text-sm text-emerald-700">
              Dog on file.{" "}
              <Link href={`${ONBOARDING_PATH}?step=route`} className="font-medium underline">
                Continue to route
              </Link>
            </p>
          ) : (
            <form action={dogAction} className="space-y-3">
              {dogState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {dogState.error}
                </p>
              ) : null}
              <label className="block text-sm font-medium text-stone-700">
                Dog name
                <input name="name" required placeholder="e.g. Moss" className={`mt-1 ${inputClassName}`} />
              </label>
              <button
                type="submit"
                disabled={dogPending}
                className={landingPrimaryButtonClassName}
              >
                {dogPending ? "Saving…" : "Save dog"}
              </button>
            </form>
          )}
        </Card>
      ) : null}

      {step === "route" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">One route</h2>
          <p className="text-sm text-stone-600">
            A route is the area you cover on weekdays. One route is enough to
            see Today, even if you also run afternoons.
          </p>
          {progress.hasRoute ? (
            <p className="text-sm text-emerald-700">
              Route is ready.{" "}
              <Link href={`${ONBOARDING_PATH}?step=prices`} className="font-medium underline">
                Continue to prices
              </Link>
            </p>
          ) : (
            <form action={routeAction} className="space-y-3">
              {routeState.error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {routeState.error}
                </p>
              ) : null}
              <label className="block text-sm font-medium text-stone-700">
                Route name
                <input
                  name="name"
                  required
                  defaultValue="Weekday route"
                  className={`mt-1 ${inputClassName}`}
                />
              </label>
              <input type="hidden" name="schedule_days" value="1,2,3,4,5" />
              <input type="hidden" name="period" value="morning" />
              {dogId ? <input type="hidden" name="dog_ids" value={dogId} /> : null}
              <p className="text-xs text-stone-500">Weekdays, morning. The dog above is assigned.</p>
              <button
                type="submit"
                disabled={routePending || !dogId}
                className={landingPrimaryButtonClassName}
              >
                {routePending ? "Saving…" : "Create the route"}
              </button>
            </form>
          )}
        </Card>
      ) : null}

      {step === "prices" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Price</h2>
          <p className="text-sm text-stone-600">
            This CA$ amount is the default for billing. A dog can override it later.
          </p>
          <form action={companyAction} className="space-y-4">
            {companyState.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {companyState.error}
              </p>
            ) : null}
            <label className="block text-sm font-medium text-stone-700" htmlFor="default_hike_rate">
              Default price per outing (CA$)
              <input
                id="default_hike_rate"
                name="default_hike_rate"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="60.00"
                defaultValue={
                  defaultHikeRateCents != null ? (defaultHikeRateCents / 100).toFixed(2) : ""
                }
                className={`mt-2 ${inputClassName}`}
              />
            </label>
            <div>
              <label
                htmlFor="night_before_reminder_time"
                className="block text-sm font-medium text-stone-700"
              >
                Night-before reminder time
              </label>
              <TimePickerField
                id="night_before_reminder_time"
                name="night_before_reminder_time"
                required
                defaultValue={nightBeforeReminderTime.slice(0, 5)}
                className="mt-2"
              />
            </div>
            <button
              type="submit"
              disabled={companyPending}
              className={landingPrimaryButtonClassName}
            >
              {companyPending ? "Saving…" : "Save and try it"}
            </button>
          </form>
        </Card>
      ) : null}

      {step === "try" ? (
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold text-stone-900">Try the three things customers see</h2>
          <p className="text-sm text-stone-600">{wizardSmsExplanation(smsMode)}</p>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-stone-900">Tonight&apos;s reminder</h3>
            <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">{preview}</p>
            <p className="text-xs text-stone-500">
              This sample goes to your mobile, not to a customer.
            </p>
            <form action={textAction} className="flex flex-wrap items-end gap-2">
              <label className="block text-sm font-medium text-stone-700">
                Your mobile
                <input
                  name="phone"
                  type="tel"
                  required
                  defaultValue={ownerPhone}
                  className={`mt-1 ${inputClassName}`}
                />
              </label>
              <button type="submit" disabled={textPending} className={landingPrimaryButtonClassName}>
                {textPending ? "Sending…" : "Text this to me"}
              </button>
            </form>
            {textState.error ? <p className="text-sm text-red-700">{textState.error}</p> : null}
            {textState.preview && !textState.error ? (
              <p className="text-sm text-emerald-700">Sent to your mobile.</p>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-stone-900">Photo gallery</h3>
            <form action={photoAction} className="space-y-2">
              <input name="photo" type="file" accept="image/jpeg" required className="text-sm" />
              <button type="submit" disabled={photoPending} className={secondaryButtonClassName}>
                {photoPending ? "Uploading…" : "Upload a sample photo"}
              </button>
            </form>
            {photoState.error ? <p className="text-sm text-red-700">{photoState.error}</p> : null}
            {openGallery ? (
              <a href={openGallery} className="text-sm font-medium text-[var(--color-trail-700)] underline">
                Open the gallery
              </a>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-stone-900">Draft invoice</h3>
            <button
              type="button"
              disabled={invoicePending}
              className={secondaryButtonClassName}
              onClick={() =>
                startInvoice(async () => {
                  setInvoiceError(null);
                  const result = await onboardingCreateSampleInvoiceAction();
                  if (result.error) setInvoiceError(result.error);
                  if (result.invoiceId) setCreatedInvoiceId(result.invoiceId);
                })
              }
            >
              {invoicePending ? "Creating…" : "Create a draft invoice"}
            </button>
            {invoiceError ? <p className="text-sm text-red-700">{invoiceError}</p> : null}
            {createdInvoiceId ? (
              <Link
                href={`/dashboard/invoices/${createdInvoiceId}`}
                className="block text-sm font-medium text-[var(--color-trail-700)] underline"
              >
                Open the draft
              </Link>
            ) : null}
          </section>

          <Link href={`${ONBOARDING_PATH}?step=done`} className={landingPrimaryButtonClassName}>
            Finish setup
          </Link>
        </Card>
      ) : null}

      {step === "done" ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">You&apos;re set</h2>
          <p className="text-sm text-stone-600">
            This checklist stays on the dashboard until each item is done.{" "}
            {wizardSmsExplanation(smsMode)}
          </p>
          <ul className="space-y-2 text-sm">
            {checklist.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <Link href={item.href} className="underline-offset-2 hover:underline">
                  {item.label}
                </Link>
                <span className={item.done ? "text-emerald-700" : "text-stone-400"}>
                  {item.done ? "Done" : "To do"}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={finishPending}
            className={landingPrimaryButtonClassName}
            onClick={() => startFinish(async () => { await completeOnboardingAction(); })}
          >
            {finishPending ? "Opening dashboard…" : "Go to dashboard"}
          </button>
        </Card>
      ) : null}

      {step !== "welcome" && step !== "done" ? (
        <div className="border-t border-stone-200 pt-4 text-sm">
          <button
            type="button"
            disabled={dismissPending}
            className="text-stone-500 underline-offset-2 hover:underline"
            onClick={snooze}
          >
            Skip setup for now
          </button>
          {dismissError ? <p className="mt-2 text-sm text-red-700">{dismissError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
