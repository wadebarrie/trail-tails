"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="text-sm font-medium text-[var(--color-trail-700)] underline-offset-2 hover:underline"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
