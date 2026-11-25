export const SIGNUP_GENERIC_ERROR = "Could not complete signup. Try again.";

export const SIGNUP_SIGN_IN_ERROR =
  "An account with this email already exists. Try signing in instead.";

export const SIGNUP_PENDING_INVITE_ERROR =
  "This email already has a PackRoute invite. Open that invite link to join the company instead of starting a new one.";

export const SIGNUP_DRIVER_EMAIL_ERROR =
  "This email is already a driver at a PackRoute company. Each email can belong to one company. Sign in, or use a different email for this business.";

const KNOWN_ERRORS = new Set([
  SIGNUP_GENERIC_ERROR,
  SIGNUP_SIGN_IN_ERROR,
  SIGNUP_PENDING_INVITE_ERROR,
  SIGNUP_DRIVER_EMAIL_ERROR,
  "New signups are temporarily paused. Contact PackRoute support for help.",
  "Self-serve signup is not open yet. Ask PackRoute for an invite link.",
  "Signup is temporarily unavailable. Try again shortly.",
  "Too many signup attempts. Wait an hour and try again.",
  "Complete the captcha and try again.",
]);

/** Hide raw Supabase and database text. Keep messages we wrote. */
export function friendlySignupError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "{}") return SIGNUP_GENERIC_ERROR;
  if (KNOWN_ERRORS.has(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("exists")
  ) {
    return SIGNUP_SIGN_IN_ERROR;
  }
  if (lower.includes("captcha")) return "Complete the captcha and try again.";
  if (lower.includes("password")) {
    return "Choose a password with at least 12 characters, a letter, and a number.";
  }
  if (
    trimmed.length > 160 ||
    /jwt|schema|relation|violates|permission|stack|function public|sql/i.test(trimmed)
  ) {
    return SIGNUP_GENERIC_ERROR;
  }
  return trimmed;
}

export function signupEmailConflict(input: {
  pendingInvite: boolean;
  existingRole: "admin" | "driver" | null;
}): string | null {
  if (input.pendingInvite) return SIGNUP_PENDING_INVITE_ERROR;
  if (input.existingRole === "driver") return SIGNUP_DRIVER_EMAIL_ERROR;
  if (input.existingRole === "admin") return SIGNUP_SIGN_IN_ERROR;
  return null;
}

export function pricingAnswerForSignup(
  question: string,
  answer: string,
  selfSignupOpen: boolean
): string {
  if (!selfSignupOpen) return answer;
  if (question === "Is the first month really free?") {
    return "Yes. Start a free trial and confirm your email — your company is created then, with no card required. When the trial ends, pick a tier or pause. Your data remains either way.";
  }
  if (question === "Is PackRoute priced in Canadian dollars?") {
    return "Yes. Public pricing is in CAD. Start a free trial with no card, or book a short demo if you would rather walk through it with us. Then pick the driver tier that fits your team.";
  }
  return answer;
}
