// The call pop-up's context, on its own so Nav and TwoWayCTA (on every page)
// can read it without pulling in CallModal, LeadForm or the form security code.
import { createContext, useContext } from "react";

export type CallModalApi = {
  /** Opens the pop-up. `opener` gets focus back on close (Safari doesn't focus links on click). */
  open: (source: string, opener?: HTMLElement | null) => void;
  close: () => void;
  isOpen: boolean;
};

export const CallModalContext = createContext<CallModalApi | null>(null);

export function useOptionalCallModal(): CallModalApi | null {
  return useContext(CallModalContext);
}

export function useCallModal(): CallModalApi {
  const ctx = useContext(CallModalContext);
  if (!ctx) throw new Error("useCallModal must be used inside <CallModalProvider>");
  return ctx;
}
