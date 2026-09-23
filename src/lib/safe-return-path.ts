/** Allow only same-origin relative paths for post-create redirects. */
export function safeAppReturnPath(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  return path;
}
