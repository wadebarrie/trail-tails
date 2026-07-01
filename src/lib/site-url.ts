/**
 * Canonical public site URL for SEO, sitemap, Open Graph, and invite links.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Hostname used for TOTP issuer (e.g. packroute.app). */
export function getSiteHost(): string {
  return new URL(getSiteUrl()).host;
}

/**
 * Issuer label shown in authenticator apps during MFA setup.
 * Prefer the current browser host so it matches where the admin signed in.
 * Supabase otherwise defaults to the Auth Site URL hostname (may be stale).
 */
export function getMfaIssuer(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.host;
  }
  return getSiteHost();
}

/** Redirect target for Supabase email links (password reset, etc.). */
export function getAuthCallbackUrl(nextPath: string): string {
  const url = new URL("/auth/callback", getSiteUrl());
  url.searchParams.set("next", nextPath);
  return url.toString();
}
