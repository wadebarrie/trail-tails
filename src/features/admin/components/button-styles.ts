/** Shared primary / CTA button styles — import in forms and link buttons. */
import { motionButtonClassName } from "@/features/admin/components/motion-styles";

const buttonBase = `inline-flex min-h-11 items-center justify-center rounded-[var(--radius-surface)] px-4 py-2.5 text-sm font-medium ${motionButtonClassName} md:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`;

export const primaryButtonClassName = `${buttonBase} bg-gradient-to-b from-[#267a66] to-[var(--color-cta)] text-white shadow-[var(--elevation-1)] hover:from-[#2a856f] hover:to-[var(--color-cta-hover)] hover:shadow-[var(--elevation-2)] active:from-[var(--color-cta-active)] active:to-[var(--color-cta-active)] active:shadow-none`;

export const secondaryButtonClassName = `${buttonBase} surface-glass text-stone-700 hover:shadow-[var(--elevation-2)] active:bg-[var(--color-surface-subtle)]`;

export const landingButtonBase = `inline-flex h-12 items-center justify-center rounded-[var(--radius-surface)] px-6 text-base font-medium ${motionButtonClassName}`;

export const landingPrimaryButtonClassName = `${landingButtonBase} bg-gradient-to-b from-[#267a66] to-[var(--color-cta)] text-white shadow-[var(--elevation-2)] hover:from-[#2a856f] hover:to-[var(--color-cta-hover)] hover:shadow-[var(--elevation-3)] active:from-[var(--color-cta-active)] active:to-[var(--color-cta-active)]`;

export const landingSecondaryLightClassName = `${landingButtonBase} surface-glass text-stone-700 hover:shadow-[var(--elevation-2)]`;

export const landingSecondaryDarkClassName = `${landingButtonBase} border border-white/25 bg-white/10 text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-md hover:bg-white/18 active:bg-white/22`;
