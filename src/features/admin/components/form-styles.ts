/** Shared form field styles — soft, inviting inputs aligned with liquid glass tokens. */
export const inputClassName =
  "w-full rounded-[var(--radius-surface)] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] px-3 py-2.5 text-sm text-stone-900 shadow-[var(--elevation-1)] transition-[border-color,box-shadow,background-color] duration-[var(--duration-fast)] hover:border-[var(--color-sage)] focus:border-[var(--color-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/20";

export const textareaClassName = `${inputClassName} min-h-[5rem] resize-y`;

export const selectClassName = inputClassName;
