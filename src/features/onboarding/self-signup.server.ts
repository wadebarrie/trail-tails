import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { profileProvisioningMetadata } from "@/features/auth/profile-provisioning";
import {
  isCaptchaRejection,
  pendingSignupAction,
  SIGNUP_ATTEMPT_WINDOW_MS,
  SIGNUP_EMAIL_ATTEMPT_LIMIT,
  SIGNUP_IP_ATTEMPT_LIMIT,
  SIGNUP_PENDING_MS,
  signupCaptchaDecision,
  signupConfirmationUrl,
  signupRateLimitExceeded,
  turnstileSiteKey,
} from "@/features/auth/signup-guards";
import { areInvitesEnabled, isSelfSignupEnabled } from "@/features/platform/settings";
import { formatTrialEndDate, trialClockUpdate } from "@/features/subscription/trial-clock";
import { sendWelcomeEmail } from "@/features/subscription/welcome-email";
import { createServiceClient } from "@/lib/supabase/service";
import { getClientEnv, getSupabaseAnonKey } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import { logError } from "@/lib/logger";
import { recordProductEvent } from "@/features/onboarding/product-events";
import {
  signupEmailConflict,
  SIGNUP_GENERIC_ERROR,
  SIGNUP_SIGN_IN_ERROR,
} from "@/features/onboarding/signup-polish";

export type SelfSignupResult =
  | { ok: true; step: "check_email"; email: string; warning?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<string, string>>;
      values?: {
        company_name: string;
        timezone: string;
        admin_full_name: string;
        admin_email: string;
        admin_phone: string;
        province: string;
        password: string;
        password_confirm: string;
      };
      revision?: number;
    };

const SIGN_IN_ERROR = SIGNUP_SIGN_IN_ERROR;
const UNAVAILABLE = "Signup is temporarily unavailable. Try again shortly.";
const RATE_LIMIT = "Too many signup attempts. Wait an hour and try again.";

type ServiceClient = ReturnType<typeof createServiceClient>;

async function clientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const netlify = headerStore.get("x-nf-client-connection-ip")?.trim();
  return (forwarded || netlify || "unknown").slice(0, 64);
}

function anonAuthClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getClientEnv();
  return createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function allowAttempt(
  service: ServiceClient,
  bucket: string,
  limit: number
): Promise<"ok" | "limited" | "unavailable"> {
  const since = new Date(Date.now() - SIGNUP_ATTEMPT_WINDOW_MS).toISOString();
  const { count, error } = await service
    .from("self_signup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if (error) return "unavailable";
  if (signupRateLimitExceeded(count ?? 0, limit)) return "limited";

  const { error: insertError } = await service
    .from("self_signup_attempts")
    .insert({ bucket });
  if (insertError) return "unavailable";
  return "ok";
}

async function enforceRateLimit(
  service: ServiceClient,
  email: string
): Promise<string | null> {
  const ip = await clientIp();
  const results = await Promise.all([
    allowAttempt(service, `signup-email:${email}`, SIGNUP_EMAIL_ATTEMPT_LIMIT),
    allowAttempt(service, `signup-ip:${ip}`, SIGNUP_IP_ATTEMPT_LIMIT),
  ]);
  if (results.includes("unavailable")) return UNAVAILABLE;
  if (results.includes("limited")) return RATE_LIMIT;
  return null;
}

async function sendConfirmation(
  email: string,
  captchaToken: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await anonAuthClient().auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: signupConfirmationUrl(getSiteUrl()),
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function deleteUnconfirmedUser(service: ServiceClient, userId: string) {
  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profile) return;
  await service.auth.admin.deleteUser(userId);
}

async function accountRoleForEmail(
  service: ServiceClient,
  email: string
): Promise<"admin" | "driver" | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  let userId: string | null = null;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const match = data.users.find((user) => user.email?.toLowerCase() === target);
    if (match) {
      userId = match.id;
      break;
    }
    if (data.users.length < 200 || page >= 20) break;
    page += 1;
  }
  if (!userId) return null;
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "driver" ? "driver" : profile ? "admin" : null;
}

export async function requestSelfSignup(input: {
  companyName: string;
  timezone: string;
  fullName: string;
  email: string;
  password: string;
  phone: string | null;
  province: string | null;
  captchaToken: string | null;
}): Promise<SelfSignupResult> {
  if (!(await areInvitesEnabled())) {
    return {
      ok: false,
      error: "New signups are temporarily paused. Contact PackRoute support for help.",
    };
  }

  const selfSignupEnabled = await isSelfSignupEnabled();
  if (!selfSignupEnabled) {
    return {
      ok: false,
      error: "Self-serve signup is not open yet. Ask PackRoute for an invite link.",
    };
  }

  const captcha = signupCaptchaDecision({
    selfSignupEnabled,
    siteKeyPresent: Boolean(turnstileSiteKey()),
    token: input.captchaToken,
  });
  if (!captcha.ok) return { ok: false, error: captcha.error };

  const email = input.email.trim().toLowerCase();
  const service = createServiceClient();
  const { data: openInvite } = await service
    .from("company_invites")
    .select("id, role, accepted_at, expires_at")
    .ilike("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  const conflict = signupEmailConflict({
    pendingInvite: Boolean(openInvite),
    existingRole: null,
  });
  if (conflict) return { ok: false, error: conflict };

  const limited = await enforceRateLimit(service, email);
  if (limited) return { ok: false, error: limited };

  const { data: pending, error: pendingError } = await service
    .from("pending_self_signups")
    .select("auth_user_id, consumed_at, expires_at")
    .eq("email", email)
    .is("consumed_at", null)
    .maybeSingle();

  if (pendingError) return { ok: false, error: UNAVAILABLE };

  let hasProfile = false;
  if (pending?.auth_user_id) {
    const { data: profile } = await service
      .from("profiles")
      .select("id")
      .eq("id", pending.auth_user_id)
      .maybeSingle();
    hasProfile = Boolean(profile);
  }

  let action = pendingSignupAction(
    pending
      ? {
          consumedAt: pending.consumed_at,
          expiresAt: pending.expires_at,
          hasProfile,
        }
      : null,
    Date.now()
  );

  await recordProductEvent({
    name: "signup_started",
    context: { stage: action },
  });

  if (action === "create") {
    const { data: previous } = await service
      .from("pending_self_signups")
      .select("id")
      .eq("email", email)
      .not("consumed_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (previous) action = "sign_in";
  }

  if (action === "sign_in") {
    return { ok: false, error: SIGN_IN_ERROR };
  }

  if (action === "restart") {
    if (pending?.auth_user_id) {
      await deleteUnconfirmedUser(service, pending.auth_user_id);
    }
    await service
      .from("pending_self_signups")
      .delete()
      .eq("email", email)
      .is("consumed_at", null);
  }

  if (action === "resend") {
    const sent = await sendConfirmation(email, captcha.token);
    if (!sent.ok) {
      if (isCaptchaRejection(sent.error)) {
        return { ok: false, error: "Complete the captcha and try again." };
      }
      return {
        ok: true,
        step: "check_email",
        email,
        warning: "We could not send the email. Use resend in a minute.",
      };
    }
    return { ok: true, step: "check_email", email };
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      full_name: input.fullName,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.province ? { province: input.province } : {}),
    },
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "";
    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
      const role = await accountRoleForEmail(service, email);
      const taken = signupEmailConflict({ pendingInvite: false, existingRole: role });
      return { ok: false, error: taken ?? SIGN_IN_ERROR };
    }
    logError("system", "Self-signup createUser failed", { context: { raw: message } });
    return { ok: false, error: message.trim() || SIGNUP_GENERIC_ERROR };
  }

  const { error: insertError } = await service.from("pending_self_signups").insert({
    email,
    company_name: input.companyName,
    timezone: input.timezone,
    full_name: input.fullName,
    auth_user_id: created.user.id,
    expires_at: new Date(Date.now() + SIGNUP_PENDING_MS).toISOString(),
  });

  if (insertError) {
    await service.auth.admin.deleteUser(created.user.id);
    if (insertError.code === "23505") {
      return { ok: true, step: "check_email", email };
    }
    return { ok: false, error: UNAVAILABLE };
  }

  const sent = await sendConfirmation(email, captcha.token);
  if (!sent.ok && isCaptchaRejection(sent.error)) {
    await deleteUnconfirmedUser(service, created.user.id);
    return { ok: false, error: "Complete the captcha and try again." };
  }

  if (!sent.ok) {
    return {
      ok: true,
      step: "check_email",
      email,
      warning: "We could not send the email. Use resend in a minute.",
    };
  }

  return { ok: true, step: "check_email", email };
}

export async function resendSelfSignup(
  email: string,
  captchaToken: string | null
): Promise<SelfSignupResult> {
  const selfSignupEnabled = await isSelfSignupEnabled();
  if (!selfSignupEnabled || !(await areInvitesEnabled())) {
    return { ok: false, error: "Self-serve signup is not open yet." };
  }

  const captcha = signupCaptchaDecision({
    selfSignupEnabled,
    siteKeyPresent: Boolean(turnstileSiteKey()),
    token: captchaToken,
  });
  if (!captcha.ok) return captcha;

  const normalized = email.trim().toLowerCase();
  const service = createServiceClient();
  const limited = await enforceRateLimit(service, normalized);
  if (limited) return { ok: false, error: limited };

  const { data: pending } = await service
    .from("pending_self_signups")
    .select("id")
    .eq("email", normalized)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!pending) {
    return {
      ok: false,
      error: "That signup expired. Start again with your email.",
    };
  }

  const sent = await sendConfirmation(normalized, captcha.token);
  if (!sent.ok) {
    if (isCaptchaRejection(sent.error)) {
      return { ok: false, error: "Complete the captcha and try again." };
    }
    return {
      ok: true,
      step: "check_email",
      email: normalized,
      warning: "We could not send the email. Wait a minute and try resend.",
    };
  }

  return { ok: true, step: "check_email", email: normalized };
}

export async function abandonSelfSignup(email: string): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  const service = createServiceClient();
  const { data: pending } = await service
    .from("pending_self_signups")
    .select("auth_user_id")
    .eq("email", normalized)
    .is("consumed_at", null)
    .maybeSingle();

  if (pending?.auth_user_id) {
    await deleteUnconfirmedUser(service, pending.auth_user_id);
  }
  await service
    .from("pending_self_signups")
    .delete()
    .eq("email", normalized)
    .is("consumed_at", null);

  return { ok: true };
}

/** Create the company only after Supabase has confirmed the email. */
export async function provisionConfirmedSelfSignup(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data: authData, error: authError } = await service.auth.admin.getUserById(userId);
  if (authError || !authData.user?.email_confirmed_at) return false;

  const { data: companyId, error } = await service.rpc("provision_self_signup", {
    p_user_id: userId,
  });

  if (error || !companyId || typeof companyId !== "string") {
    const { data: profile } = await service
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    return Boolean(profile);
  }

  const { data: pending } = await service
    .from("pending_self_signups")
    .select("full_name")
    .eq("auth_user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  const priorMeta = authData.user.user_metadata as {
    phone?: unknown;
    province?: unknown;
  };
  const signupPhone = typeof priorMeta.phone === "string" ? priorMeta.phone : "";
  const signupProvince =
    typeof priorMeta.province === "string" ? priorMeta.province : "";

  const metadata = profileProvisioningMetadata({
    companyId,
    role: "admin",
    fullName: pending?.full_name ?? authData.user.email?.split("@")[0] ?? "Owner",
    canDrive: true,
  });

  await service.auth.admin.updateUserById(userId, {
    app_metadata: metadata.app_metadata,
    user_metadata: {
      ...metadata.user_metadata,
      ...(signupPhone ? { phone: signupPhone } : {}),
      ...(signupProvince ? { province: signupProvince } : {}),
    },
  });

  const clock = trialClockUpdate();
  await service.from("subscriptions").update(clock).eq("company_id", companyId);
  await service
    .from("companies")
    .update({ sms_mode: "test", sms_live_approved: false })
    .eq("id", companyId);
  if (signupPhone) {
    await service.from("profiles").update({ phone: signupPhone }).eq("id", userId);
    await service
      .from("companies")
      .update({ sms_test_phone: signupPhone })
      .eq("id", companyId);
  }
  if (signupProvince) {
    await service.from("companies").update({ province: signupProvince }).eq("id", companyId);
  }
  await recordProductEvent({
    name: "signup_completed",
    companyId,
    once: true,
    context: { stage: "company_created" },
  });
  const { data: company } = await service
    .from("companies")
    .select("timezone")
    .eq("id", companyId)
    .maybeSingle();
  if (authData.user.email) {
    await sendWelcomeEmail({
      to: authData.user.email,
      trialEndsOn: formatTrialEndDate(
        clock.trial_ends_at,
        company?.timezone ?? "America/Vancouver"
      ),
    });
  }

  return true;
}
