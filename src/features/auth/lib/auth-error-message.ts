/** Turn Auth / unknown failures into a safe string for UI (never `{}` / objects). */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    const trimmed = error.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "[object Object]") {
      return fallback;
    }
    return humanizeAuthText(trimmed, fallback);
  }

  if (typeof error === "object") {
    const record = error as { message?: unknown; error_description?: unknown; msg?: unknown };
    for (const key of ["message", "error_description", "msg"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return humanizeAuthText(value.trim(), fallback);
      }
    }
  }

  return fallback;
}

function humanizeAuthText(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") || lower.includes("seconds")) {
    return "Please wait a moment before requesting another code.";
  }
  if (lower.includes("redirect") || lower.includes("whitelist") || lower.includes("allow list")) {
    return "Sign-in email could not be sent (redirect URL not allowed). Contact support.";
  }
  if (lower.includes("smtp") || lower.includes("sending") || lower.includes("error sending")) {
    return "We could not send the email right now. Check spam, wait a minute, or contact support.";
  }
  if (lower === "{}" || lower === "[object object]") {
    return fallback;
  }
  return message;
}
