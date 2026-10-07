"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

// Sign out, from anywhere in the admin rather than only from the WhatsApp
// inbox, which was the one page that had it. The cookie is httpOnly, so
// clearing it has to go through /api/admin-logout.
export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/admin-logout", { method: "POST" });
        } finally {
          window.location.href = "/admin/login";
        }
      }}
      aria-label={busy ? "Signing out" : "Sign out"}
      title="Sign out"
      className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 md:h-auto md:min-w-0 md:py-1.5"
    >
      <LogOut className="h-[18px] w-[18px] md:h-3.5 md:w-3.5" />
      {/* Icon-only on a phone, like "View site" beside it. */}
      <span className="hidden md:inline">{busy ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
