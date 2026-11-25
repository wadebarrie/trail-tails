import { getSiteUrl } from "@/lib/site-url";

export function buildWelcomeEmail(input: {
  loginUrl: string;
  helpUrl: string;
  trialEndsOn: string;
}): { subject: string; text: string } {
  return {
    subject: "Welcome to PackRoute",
    text: [
      "Welcome to PackRoute.",
      "",
      `Sign in: ${input.loginUrl}`,
      `Your trial ends on ${input.trialEndsOn}.`,
      `Help: ${input.helpUrl}`,
      "",
      "To try a customer text, add a customer that uses your own mobile number, assign their dog to a route, and mark a stop en route. PackRoute texts that number the same way it texts a pet owner.",
    ].join("\n"),
  };
}

export function welcomeEmailLinks(siteUrl = getSiteUrl()): {
  loginUrl: string;
  helpUrl: string;
} {
  const base = siteUrl.replace(/\/$/, "");
  return {
    loginUrl: `${base}/login`,
    helpUrl: `${base}/dashboard/help`,
  };
}

/** Sends only when Resend is configured. Never throws. */
export async function sendWelcomeEmail(input: {
  to: string;
  trialEndsOn: string;
}): Promise<"sent" | "skipped"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WELCOME_FROM_EMAIL?.trim();
  if (!apiKey || !from || !input.to.trim()) return "skipped";

  const links = welcomeEmailLinks();
  const message = buildWelcomeEmail({
    ...links,
    trialEndsOn: input.trialEndsOn,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to.trim()],
        subject: message.subject,
        text: message.text,
      }),
    });
    return response.ok ? "sent" : "skipped";
  } catch {
    return "skipped";
  }
}
