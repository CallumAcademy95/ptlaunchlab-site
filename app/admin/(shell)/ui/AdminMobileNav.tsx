"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebarNav } from "./AdminSidebarNav";

// The rail, as a drawer, for the phone. The admin gets opened on a phone more
// than anywhere else — usually to check one gym — so the nav has to exist
// below md, where the sticky sidebar is hidden.
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-slate-900 pb-8">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[15px] font-semibold tracking-tight text-white">
                PT Launch Lab
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="text-slate-400 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-3">
              <AdminSidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
