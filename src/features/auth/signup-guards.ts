import { ONBOARDING_PATH } from "@/features/onboarding/constants";
import { getLoginRedirect } from "@/features/auth/access";

export const SIGNUP_EMAIL_ATTEMPT_LIMIT = 5;
export const SIGNUP_IP_ATTEMPT_LIMIT = 20;
export const SIGNUP_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
export const SIGNUP_PENDING_MS = 24 * 60 * 60 * 1000;

const CAPTCHA_REQUIRED = "Complete the captcha and try again.";
const CAPTCHA_UNCONFIGURED =
  "Signup is unavailable until bot protection is configured.";

export function signupCaptchaDecision(input: {
  selfSignupEnabled: boolean;
  siteKeyPresent: boolean;
  token: string | null | undefined;
}): { ok: true; token: string | null } | { ok: false; error: string } {
  if (!input.selfSignupEnabled) {
    return { ok: true, token: null };
  }

  if (!input.siteKeyPresent) {
    return { ok: false, error: CAPTCHA_UNCONFIGURED };
  }

  const token = input.token?.trim() ?? "";
  if (!token) {
    return { ok: false, error: CAPTCHA_REQUIRED };
  }

  return { ok: true, token };
}

/** Login and password reset. Missing site key skips the widget so existing sign-in keeps working. */
export function interactiveCaptchaDecision(input: {
  siteKeyPresent: boolean;
  token: string | null | undefined;
}): { ok: true; token?: string } | { ok: false; error: string } {
  if (!input.siteKeyPresent) {
    return { ok: true };
  }

  const token = input.token?.trim() ?? "";
  if (!token) {
    return { ok: false, error: CAPTCHA_REQUIRED };
  }

  return { ok: true, token };
}

export function isCaptchaRejection(message: string | undefined): boolean {
  return (message ?? "").toLowerCase().includes("captcha");
}

export function signupRateLimitExceeded(count: number, limit: number): boolean {
  return count >= limit;
}

export type PendingSignupState = {
  consumedAt: string | null;
  expiresAt: string;
  hasProfile: boolean;
};

export function pendingSignupAction(
  row: PendingSignupState | null,
  nowMs: number
): "create" | "resend" | "restart" | "sign_in" {
  if (!row) return "create";
  if (row.hasProfile || row.consumedAt) return "sign_in";
  const expiresAt = Date.parse(row.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) return "restart";
  return "resend";
}

export function signupConfirmationUrl(siteUrl: string): string {
  const url = new URL("/auth/callback", siteUrl.replace(/\/$/, ""));
  url.searchParams.set("next", ONBOARDING_PATH);
  url.searchParams.set("mfa", "1");
  return url.toString();
}

export function postAuthDestination(input: {
  role: "admin" | "driver";
  canDrive: boolean;
  onboardingCompletedAt: string | null;
  next?: string | null;
}): string {
  if (input.role === "admin" && input.onboardingCompletedAt == null) {
    if (input.next?.startsWith(ONBOARDING_PATH)) return input.next;
    return ONBOARDING_PATH;
  }

  return getLoginRedirect(
    { role: input.role, can_drive: input.canDrive, is_active: true },
    input.next ?? undefined
  );
}

export function turnstileSiteKey(): string | null {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value ? value : null;
}
