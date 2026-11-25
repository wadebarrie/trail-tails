"use client";

import { useState } from "react";
import { secondaryButtonClassName } from "@/features/admin/components/button-styles";

export function CopyInvoiceLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={secondaryButtonClassName}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Link copied" : "Copy invoice link"}
    </button>
  );
}
