"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type DriverFeedbackContextValue = {
  showFeedback: (message: string) => void;
};

const DriverFeedbackContext = createContext<DriverFeedbackContextValue | null>(
  null
);

export function DriverFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showFeedback = useCallback((text: string) => {
    setMessage(text);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <DriverFeedbackContext.Provider value={{ showFeedback }}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-2xl border border-white/15 bg-[var(--color-trail-700)] px-4 py-3 text-center text-sm text-white shadow-lg">
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
