import { createServiceClient } from "@/lib/supabase/service";

export type LogLevel = "info" | "warn" | "error";

export type LogCategory =
  | "sms"
  | "eta"
  | "geocode"
  | "hike"
  | "webhook"
  | "driver"
  | "system"
  | "cron";

type LogOptions = {
  companyId?: string | null;
  context?: Record<string, unknown>;
};

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }
  return { errorMessage: String(error) };
}

function writeConsole(
  level: LogLevel,
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    category,
    message,
    companyId: options?.companyId ?? null,
    ...options?.context,
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

async function persist(
  level: LogLevel,
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  if (level === "info") return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createServiceClient();
    await supabase.from("system_logs").insert({
      company_id: options?.companyId ?? null,
      level,
      category,
      message,
      context: options?.context ?? {},
    });
  } catch {
    // Logging must never break app flows
  }
}

function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  writeConsole(level, category, message, options);
  void persist(level, category, message, options);
}

export function logInfo(
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  log("info", category, message, options);
}

export function logWarn(
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  log("warn", category, message, options);
}

export function logError(
  category: LogCategory,
  message: string,
  options?: LogOptions
) {
  log("error", category, message, options);
}

export function logErrorFromException(
  category: LogCategory,
  message: string,
  error: unknown,
  options?: LogOptions
) {
  log("error", category, message, {
    ...options,
    context: {
      ...options?.context,
      ...serializeError(error),
    },
  });
}
