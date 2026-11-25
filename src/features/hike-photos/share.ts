import { randomBytes } from "node:crypto";
import { getSiteUrl } from "@/lib/site-url";

export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function buildGalleryUrl(token: string): string {
  return `${getSiteUrl()}/p/${token}`;
}

export function isValidShareTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}
