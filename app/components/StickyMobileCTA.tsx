"use client";
import { useEffect, useState } from "react";

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-deep/95 backdrop-blur-md border-t border-white/[0.06] px-4 py-3 flex gap-3">
      <a
        href="/book-call"
        className="flex-1 text-center py-3 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
      >
        Discover Your Pathway →
      </a>
      <a
        href="/enrol"
        className="flex-1 text-center py-3 rounded-full border border-gold/50 text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
      >
        Start Today
      </a>
    </div>
  );
}
