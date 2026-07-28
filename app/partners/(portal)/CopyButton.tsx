"use client";

import { useState } from "react";

export default function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins and in some in-app browsers.
      // The value is always shown as selectable text next to this button, so
      // there is a manual path — no need to shout about it.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`px-4 py-2 rounded-full bg-gold text-deep text-sm font-bold hover:brightness-110 transition-all shrink-0 ${className}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
