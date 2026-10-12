"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import LeadForm from "@/app/components/LeadForm";
import { CALL_QUESTION, callSuccessMessage } from "@/app/lib/homeCta";

type CallModalApi = { open: (source: string) => void; close: () => void; isOpen: boolean };

const CallModalCtx = createContext<CallModalApi | null>(null);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CallModalProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  const isOpen = source !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const open = useCallback((s: string) => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSource(s);
  }, []);
  const close = useCallback(() => setSource(null), []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("ptll:call-modal", { detail: { open: true } }));
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
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
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new CustomEvent("ptll:call-modal", { detail: { open: false } }));
      openerRef.current?.focus();
    };
  }, [isOpen, close]);

  const api = useMemo<CallModalApi>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <CallModalCtx.Provider value={api}>
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
    </CallModalCtx.Provider>
  );
}

export function useOptionalCallModal(): CallModalApi | null {
  return useContext(CallModalCtx);
}

export function useCallModal(): CallModalApi {
  const ctx = useContext(CallModalCtx);
  if (!ctx) throw new Error("useCallModal must be used inside <CallModalProvider>");
  return ctx;
}
