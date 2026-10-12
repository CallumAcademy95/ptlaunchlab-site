"use client";
import type { MouseEvent, ReactNode } from "react";
import { CALL_HREF, shouldOpenCallModal } from "@/app/lib/homeCta";
import { useOptionalCallModal } from "./callModalContext";

// "Book a free call" as a real link. In the static HTML (and before hydration,
// or without JS) it goes to /book-call. Inside a CallModalProvider a plain
// click opens the pop-up instead. Tracking.tsx's document-level listener still
// sees an a[href="/book-call"] click and sends cta_clicked either way.
export default function CallLink({
  source,
  className,
  children,
  onClick,
}: {
  source: string;
  className?: string;
  children: ReactNode;
  /** Runs on every click (tracking, closing a menu), before the pop-up opens. */
  onClick?: () => void;
}) {
  const modal = useOptionalCallModal();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (modal && shouldOpenCallModal(e)) {
      e.preventDefault();
      modal.open(source, e.currentTarget);
    }
  };
  return (
    <a href={CALL_HREF} className={className} onClick={handle}>
      {children}
    </a>
  );
}
