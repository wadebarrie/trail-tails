"use client";

import { useEffect } from "react";

export function ExceptionAddedBanner({ message }: { message: string }) {
  useEffect(() => {
    const list = document.getElementById("schedule-exceptions-list");
    if (!list) return;
    const timer = window.setTimeout(() => {
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
      role="status"
    >
      <p className="font-medium">Exception added</p>
      <p className="mt-0.5 text-green-800">{message}</p>
      <p className="mt-1 text-xs text-green-700">
        Highlighted in the list below.
      </p>
    </div>
  );
}
