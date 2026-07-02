"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  motionFeedbackClassName,
  motionFeedbackExitClassName,
} from "@/features/admin/components/motion-styles";

const FEEDBACK_VISIBLE_MS = 3200;
const FEEDBACK_EXIT_MS = 150;

type DriverFeedbackContextValue = {
  showFeedback: (message: string) => void;
};

const DriverFeedbackContext = createContext<DriverFeedbackContextValue | null>(
  null
);

export function DriverFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

  const showFeedback = useCallback((text: string) => {
    setExiting(false);
    setMessage(text);
  }, []);

  useEffect(() => {
    if (!message || exiting) return;

    const dismissTimer = window.setTimeout(() => {
      setExiting(true);
    }, FEEDBACK_VISIBLE_MS);

    return () => window.clearTimeout(dismissTimer);
  }, [message, exiting]);

  useEffect(() => {
    if (!exiting) return;

    const removeTimer = window.setTimeout(() => {
      setMessage(null);
      setExiting(false);
    }, FEEDBACK_EXIT_MS);

    return () => window.clearTimeout(removeTimer);
  }, [exiting]);

  return (
    <DriverFeedbackContext.Provider value={{ showFeedback }}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md"
          role="status"
          aria-live="polite"
        >
          <p
            className={`rounded-2xl border border-white/15 bg-[var(--color-trail-700)] px-4 py-3 text-center text-sm text-white shadow-lg ${
              exiting ? motionFeedbackExitClassName : motionFeedbackClassName
            }`}
          >
            {message}
          </p>
        </div>
      ) : null}
    </DriverFeedbackContext.Provider>
  );
}

export function useDriverFeedback() {
  const ctx = useContext(DriverFeedbackContext);
  if (!ctx) {
    throw new Error("useDriverFeedback must be used within DriverFeedbackProvider");
  }
  return ctx;
}
