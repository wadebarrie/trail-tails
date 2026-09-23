/**
 * Deploy / runtime environment for PackRoute.
 *
 * Set PACKROUTE_APP_ENV on each Netlify context:
 * - production (main) → production
 * - beta branch → beta
 * - staging branch → staging
 * - PR previews / other branches → preview
 * - local → development (default)
 */
export type PackRouteAppEnv =
  | "production"
  | "beta"
  | "staging"
  | "preview"
  | "development";

const KNOWN: readonly PackRouteAppEnv[] = [
  "production",
  "beta",
  "staging",
  "preview",
  "development",
] as const;

export function getAppEnv(): PackRouteAppEnv {
  const raw = process.env.PACKROUTE_APP_ENV?.trim().toLowerCase();
  if (raw && (KNOWN as readonly string[]).includes(raw)) {
    return raw as PackRouteAppEnv;
  }

  if (process.env.NODE_ENV !== "production") return "development";

  // Netlify production context without explicit env — treat as production.
  if (process.env.CONTEXT === "production") return "production";
  if (process.env.CONTEXT === "deploy-preview") return "preview";
  if (process.env.CONTEXT === "branch-deploy") {
    const branch = process.env.BRANCH?.toLowerCase();
    if (branch === "beta") return "beta";
    if (branch === "staging") return "staging";
    return "preview";
  }

  return "production";
}

/** True only for the public production site (packroute.app). */
export function isProductionApp(): boolean {
  return getAppEnv() === "production";
}

/** Non-production hosted deploys (staging, beta, PR previews). */
export function isNonProductionHosted(): boolean {
  const env = getAppEnv();
  return env === "staging" || env === "beta" || env === "preview";
}
