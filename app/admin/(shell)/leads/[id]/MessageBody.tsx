"use client";

import { useState } from "react";

// One message in the lead conversation: the readable version by default, the
// stored body one click away.
//
// Both are rendered as React text — never as HTML — so a body full of markup
// can't inject anything; at worst it shows its own tags in "Show original".
// The cleaning happens on the server (message-display.ts); this component only
// owns the toggle.

export function MessageBody({
  text,
  hadQuote,
  original,
  hasMedia = false,
}: {
  text: string;
  hadQuote: boolean;
  /** The stored body, newline-normalised. Only passed when it was HTML or had a quote cut. */
  original?: string;
  /** The message carries attachments, so an empty text is not "(empty)" — it's an image-only message. */
  hasMedia?: boolean;
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="min-w-0">
      {(text || !hasMedia) && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 [overflow-wrap:anywhere]">
          {text || "(empty)"}
        </p>
      )}
      {original !== undefined && (
        <div className="mt-2 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span>{hadQuote ? "Earlier messages hidden" : "Formatting tidied"}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              aria-expanded={showOriginal}
              className="inline-flex min-h-8 items-center font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
            >
              {showOriginal ? "Hide original" : "Show original"}
            </button>
          </div>
          {showOriginal && (
            <pre className="mt-1.5 max-h-96 min-w-0 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
              {original}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
