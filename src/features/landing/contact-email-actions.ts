import { SITE_CONTACT_EMAIL } from "@/lib/seo/metadata";

export const DEMO_EMAIL_SUBJECT = "PackRoute demo request";
export const WAITLIST_EMAIL_SUBJECT = "PackRoute early access";

export function gmailComposeUrl(to: string, subject: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function outlookComposeUrl(to: string, subject: string) {
  const params = new URLSearchParams({ to, subject });
  return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
}

export async function copyContactEmail(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(SITE_CONTACT_EMAIL);
    return true;
  } catch {
    return false;
  }
}

export function openEmailCompose(subject: string) {
  window.open(
    gmailComposeUrl(SITE_CONTACT_EMAIL, subject),
    "_blank",
    "noopener,noreferrer"
  );
}
