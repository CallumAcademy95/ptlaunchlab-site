"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminSidebarNav } from "./AdminSidebarNav";
import { PhoneAlerts } from "../PhoneAlerts";

// The rail, as a drawer, for the phone. The admin gets opened on a phone more
// than anywhere else — usually to check one gym — so the nav has to exist
// below md, where the sticky sidebar is hidden.
//
// The drawer is portalled into document.body. It used to render inline, inside
// the shell's sticky top bar — and that bar has `backdrop-blur`. Any
// backdrop-filter makes its element the containing block for position:fixed
// descendants, so `fixed inset-0` meant "fill the 56px header", not "fill the
// screen": the menu opened as a dark strip across the top bar and nothing
// else. Rendering at the body level takes it out of that box entirely.
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // createPortal needs document.body, which does not exist during SSR.
  useEffect(() => setMounted(true), []);

  // Close whenever the route changes (back button, a link inside the drawer).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      // Hand focus back to the button that opened it — but only after it was
      // actually open, not on first render.
      if (wasOpen.current) menuButtonRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = (
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-slate-900/50"
      />
      <div
        className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain border-t-[3px] border-[#F5C518] bg-slate-900 shadow-2xl"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between py-2 pl-5 pr-2">
          <span className="flex items-center gap-2.5 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5C518] text-sm font-extrabold text-slate-900">
              PT
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PT Launch Lab</span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3 pt-2">
          <AdminSidebarNav onNavigate={() => setOpen(false)} touch />
        </div>
        <div className="mt-6 px-3">
          <PhoneAlerts />
        </div>
      </div>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="-ml-1 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted && createPortal(drawer, document.body)}
    </div>
  );
}
