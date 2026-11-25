"use client";

import { useEffect, useRef } from "react";

type TurnstileFieldProps = {
  siteKey: string | null;
  onToken?: (token: string) => void;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

function turnstileApi(): TurnstileApi | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { turnstile?: TurnstileApi }).turnstile ?? null;
}

/** Cloudflare Turnstile widget. The token is submitted as `captcha_token`. */
export function TurnstileField({ siteKey, onToken }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    function render() {
      const api = turnstileApi();
      if (!api || !containerRef.current || cancelled || widgetId.current) return;
      widgetId.current = api.render(containerRef.current, {
        sitekey: siteKey as string,
        callback: (token) => {
          if (inputRef.current) inputRef.current.value = token;
          onToken?.(token);
        },
        "expired-callback": () => {
          if (inputRef.current) inputRef.current.value = "";
          onToken?.("");
        },
        "error-callback": () => {
          if (inputRef.current) inputRef.current.value = "";
          onToken?.("");
        },
      });
    }

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]"
    );
    if (turnstileApi()) {
      render();
    } else if (existing) {
      existing.addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "true";
      script.addEventListener("load", render);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      const api = turnstileApi();
      if (api && widgetId.current) {
        api.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div>
      <div ref={containerRef} className="min-h-16" />
      <input ref={inputRef} type="hidden" name="captcha_token" defaultValue="" />
    </div>
  );
}
