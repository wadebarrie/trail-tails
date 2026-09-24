/** Shared form field styles — soft, inviting inputs aligned with liquid glass tokens. */

const fieldChrome =
  "rounded-[var(--radius-surface)] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] text-sm text-stone-900 shadow-[var(--elevation-1)] transition-[border-color,box-shadow,background-color] duration-[var(--duration-fast)] hover:border-[var(--color-sage)] focus:border-[var(--color-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/20 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClassName = `w-full ${fieldChrome} px-3 py-2.5`;

export const textareaClassName = `${inputClassName} min-h-[5rem] resize-y`;

/** Full-width select (forms). */
export const selectClassName = inputClassName;

/** Inline select (route/hike driver·vehicle·add-dog). */
export const selectCompactClassName = `${fieldChrome} px-2 py-1.5`;
