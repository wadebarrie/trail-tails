"use client";

import { useEffect } from "react";
import type { DriverStopView } from "@/features/driver-actions/queries";

function mapsUrl(stop: DriverStopView): string | null {
  if (stop.destinationLat != null && stop.destinationLng != null) {
    return `https://maps.google.com/?q=${stop.destinationLat},${stop.destinationLng}`;
  }
  if (stop.address) {
    return `https://maps.google.com/?q=${encodeURIComponent(stop.address)}`;
  }
  return null;
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-white/45">
        {label}
      </dt>
      <dd className="mt-1 text-base text-white">{children}</dd>
    </div>
  );
}

type DriverCustomerInfoSheetProps = {
  stop: DriverStopView | null;
  open: boolean;
  onClose: () => void;
};

export function DriverCustomerInfoSheet({
  stop,
  open,
  onClose,
}: DriverCustomerInfoSheetProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !stop) return null;

  const directionsUrl = mapsUrl(stop);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close customer info"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-customer-info-title"
        className="motion-sheet relative z-10 max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[var(--radius-card)] surface-glass-dark border border-white/10 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--elevation-3)]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="driver-customer-info-title" className="text-xl font-semibold">
              {stop.dogName}
            </h2>
            {stop.dogBreed ? (
              <p className="mt-0.5 text-sm text-white/55">{stop.dogBreed}</p>
            ) : null}
            {stop.ownerName ? (
              <p className="mt-1 text-sm text-white/70">{stop.ownerName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <dl className="mt-6 space-y-5">
          {stop.phone ? (
            <InfoRow label="Phone">
              <a
                href={`tel:${stop.phone.replace(/\s/g, "")}`}
                className="font-medium text-sky-300 underline-offset-2 hover:underline"
              >
                {stop.ownerName ? `${stop.ownerName} · ` : null}
                {stop.phone}
              </a>
            </InfoRow>
          ) : null}

          {stop.secondaryPhone ? (
            <InfoRow label="Second contact">
              <a
                href={`tel:${stop.secondaryPhone.replace(/\s/g, "")}`}
                className="font-medium text-sky-300 underline-offset-2 hover:underline"
              >
                {stop.secondaryOwnerName ? `${stop.secondaryOwnerName} · ` : null}
                {stop.secondaryPhone}
              </a>
            </InfoRow>
          ) : null}

          {stop.email ? (
            <InfoRow label="Email">
              <a
                href={`mailto:${stop.email}`}
                className="break-all text-sky-300 underline-offset-2 hover:underline"
              >
                {stop.email}
              </a>
            </InfoRow>
          ) : null}

          {stop.address ? (
            <InfoRow label="Address">
              {directionsUrl ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block underline-offset-2 hover:underline"
                >
                  {stop.address}
                </a>
              ) : (
                stop.address
              )}
            </InfoRow>
          ) : null}

          {stop.customerNotes ? (
            <InfoRow label="Customer notes">
              <p className="whitespace-pre-wrap text-white/85">{stop.customerNotes}</p>
            </InfoRow>
          ) : null}

          {stop.dogNotes ? (
            <InfoRow label="Dog notes">
              <p className="whitespace-pre-wrap text-white/85">{stop.dogNotes}</p>
            </InfoRow>
          ) : null}
        </dl>

        {directionsUrl ? (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-[var(--radius-card)] bg-white/10 text-sm font-semibold text-white motion-interactive hover:bg-white/15 active:scale-[0.98]"
          >
            Open in Maps
          </a>
        ) : null}
      </div>
    </div>
  );
}
