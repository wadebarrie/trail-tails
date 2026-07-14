export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-trail-500)]"
    >
      Skip to main content
    </a>
  );
}
