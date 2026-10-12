"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { CALL_QUESTION, callSuccessMessage, popupAllowedOnPath } from "@/app/lib/homeCta";
import { CallModalContext, type CallModalApi } from "./callModalContext";

// LeadForm (and submitLead and the form security code behind it) loads only
// when the pop-up first opens, so it doesn't ship with the page.
const LeadForm = dynamic(() => import("@/app/components/LeadForm"), {
  ssr: false,
  loading: () => <p className="px-6 pb-6 pt-4 text-soft text-sm" role="status">Loading the form…</p>,
});

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CallModalProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  const pathname = usePathname();
  // Never shown on /book-call or /enrol/success, even if opened elsewhere and navigated here.
  const isOpen = source !== null && popupAllowedOnPath(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const open = useCallback((s: string, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSource(s);
  }, []);
  const close = useCallback(() => setSource(null), []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("ptll:call-modal", { detail: { open: true } }));
    // The form arrives a moment later (next/dynamic): focus the close button
    // now, then the first field as soon as it renders.
    const panel = panelRef.current;
    const firstInput = () => panel?.querySelector<HTMLElement>("input");
    let mo: MutationObserver | null = null;
    if (firstInput()) firstInput()!.focus();
    else {
      panel?.querySelector<HTMLElement>("button")?.focus();
      if (panel) {
        mo = new MutationObserver(() => {
          const input = firstInput();
          if (!input) return;
          if (!panel.contains(document.activeElement) || document.activeElement === panel.querySelector("button")) input.focus();
          mo?.disconnect();
        });
        mo.observe(panel, { childList: true, subtree: true });
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Esc on a <select> closes its own list; it mustn't close the pop-up too.
        if (e.target instanceof HTMLElement && e.target.tagName === "SELECT") return;
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      mo?.disconnect();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new CustomEvent("ptll:call-modal", { detail: { open: false } }));
      // The opener can unmount while the pop-up is open (the mobile nav menu
      // closes when its "Book a free call" is pressed). Fall back to the menu
      // toggle, else drop focus to the document rather than lose it silently.
      const opener = openerRef.current;
      if (opener?.isConnected) {
        opener.focus();
        // If the opener was still inert/hidden in this commit, retry next frame.
        if (document.activeElement !== opener) requestAnimationFrame(() => opener.focus());
      } else {
        const toggle = document.querySelector<HTMLElement>('nav button[aria-label="Toggle menu"]');
        if (toggle && toggle.offsetParent !== null) toggle.focus();
        else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
    };
  }, [isOpen, close]);

  const api = useMemo<CallModalApi>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <CallModalContext.Provider value={api}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative bg-deep border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 text-2xl leading-none"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <h2 id={titleId} className="text-white font-black text-xl pr-10">Book a free call</h2>
            <p className="text-soft text-sm mt-1">Tell us when suits you. We&apos;ll call you today.</p>
            <div className="-mx-6 -mb-6">
              <LeadForm
                intent="call"
                source={source}
                tone="dark"
                variant="modal"
                question={CALL_QUESTION}
                successMessage={(first) => callSuccessMessage(first)}
              />
            </div>
          </div>
        </div>
      )}
    </CallModalContext.Provider>
  );
}
