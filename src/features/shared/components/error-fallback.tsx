type ErrorFallbackProps = {
  title: string;
  description: string;
  reset?: () => void;
  homeHref?: string;
  homeLabel?: string;
};

export function ErrorFallback({
  title,
  description,
  reset,
  homeHref = "/",
  homeLabel = "Go home",
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-trail-50)] px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-trail-800)]">{title}</h1>
      <p className="mt-3 max-w-md text-stone-600">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[var(--color-cta)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cta-hover)]"
          >
            Try again
          </button>
        ) : null}
        <a
          href={homeHref}
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
