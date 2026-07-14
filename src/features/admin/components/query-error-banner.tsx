/** Surfaces Supabase query failures instead of showing empty lists. */
export function QueryErrorBanner({
  message = "We couldn't load this data. Refresh the page or try again in a moment.",
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="mb-6 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-red-800">{message}</p>
    </div>
  );
}
