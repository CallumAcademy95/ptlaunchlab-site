"use client";

import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/app/lib/gtag";

/**
 * A gym page point of sale: a plain link (the gym's own enrol page or its
 * #ring-me form) that sends cta_click with the gym's slug. It never opens the
 * site's call pop-up, which would lose the gym attribution that the ring-me
 * form (intent=gym_callback) carries.
 */
export default function GymCtaLink({
  href,
  source,
  action,
  gym,
  className,
  style,
  children,
}: {
  href: string;
  source: string;
  action: "enrol" | "call";
  gym: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a href={href} onClick={() => trackEvent("cta_click", { source, action, gym })} className={className} style={style}>
      {children}
    </a>
  );
}
