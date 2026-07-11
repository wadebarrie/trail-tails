import Link from "next/link";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/features/admin/components/button-styles";
import { inputClassName } from "@/features/admin/components/form-styles";
import { motionCardClassName } from "@/features/admin/components/motion-styles";

export { inputClassName };
export { motionTableRowClassName } from "@/features/admin/components/motion-styles";

export function TableShell({
  children,
  minWidth = "36rem",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        className="surface-glass-strong overflow-hidden rounded-[var(--radius-card)]"
        style={{ minWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-stone-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`surface-elevated rounded-[var(--radius-card)] p-5 ${motionCardClassName} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-stone-100/90 text-stone-700 ring-1 ring-[var(--glass-border-subtle)]",
    green: "bg-green-100/90 text-green-800 ring-1 ring-green-200/60",
    amber: "bg-amber-100/90 text-amber-900 ring-1 ring-amber-200/60",
    red: "bg-red-100/90 text-red-800 ring-1 ring-red-200/60",
  };
  return (
    <span
      className={`inline-flex rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="surface-card rounded-[var(--radius-card)] border-dashed px-6 py-12 text-center text-stone-500">
      {message}
    </p>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={primaryButtonClassName}>
      {children}
    </Link>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[var(--color-trail-700)] hover:underline"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}

export function SearchBar({
  name = "q",
  defaultValue,
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <form method="get" className="mb-6 flex max-w-md flex-col gap-2 sm:flex-row">
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`${inputClassName} min-h-11 flex-1`}
      />
      <button type="submit" className={`${secondaryButtonClassName} sm:px-5`}>
        Search
      </button>
    </form>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${primaryButtonClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${secondaryButtonClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function SubmitButton({
  children,
  pending,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${primaryButtonClassName} ${className}`.trim()}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
