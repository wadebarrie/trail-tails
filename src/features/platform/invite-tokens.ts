import { createHash, randomBytes } from "crypto";
import { getSiteUrl } from "@/lib/site-url";

export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildInviteUrl(token: string): string {
  return `${getSiteUrl()}/signup?token=${encodeURIComponent(token)}`;
}
