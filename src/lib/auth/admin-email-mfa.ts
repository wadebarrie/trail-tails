import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_EMAIL_MFA_COOKIE = "packroute_admin_mfa";

/** Session lifetime for email MFA step-up (matches a working day). */
const MAX_AGE_SEC = 60 * 60 * 12;

type CookiePayload = {
  uid: string;
  exp: number;
};

function getCookieSecret(): string {
  const explicit = process.env.ADMIN_MFA_COOKIE_SECRET?.trim();
  if (explicit) return explicit;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRole) return `packroute-mfa:${serviceRole}`;
  return "packroute-mfa-dev-insecure";
}

function sign(payload: CookiePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getCookieSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function unseal(token: string): CookiePayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = createHmac("sha256", getCookieSecret())
    .update(body)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as CookiePayload;
    if (!parsed?.uid || typeof parsed.exp !== "number") return null;
    if (parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setAdminEmailMfaCookie(userId: string): Promise<void> {
  const jar = await cookies();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  jar.set(ADMIN_EMAIL_MFA_COOKIE, sign({ uid: userId, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminEmailMfaCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_EMAIL_MFA_COOKIE);
}

export async function hasValidAdminEmailMfaCookie(
  userId: string
): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_EMAIL_MFA_COOKIE)?.value;
  if (!raw) return false;
  const payload = unseal(raw);
  return payload?.uid === userId;
}
