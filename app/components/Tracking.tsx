"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "msclkid",
  "ttclid",
] as const;

type Touch = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  ts: number;
  landing_path: string;
  referrer: string;
};

const FIRST_TOUCH_KEY = "ptll_first_touch";
const LAST_TOUCH_KEY = "ptll_last_touch";
const SCROLL_DEPTHS = [25, 50, 75, 90] as const;

function readTouch(key: string): Touch | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
}

function writeTouch(key: string, touch: Touch) {
  try {
    localStorage.setItem(key, JSON.stringify(touch));
  } catch {
    // ignore quota errors
  }
}

function captureUtms() {
  const params = new URLSearchParams(window.location.search);
  const incoming: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) incoming[k] = v;
  });

  const hasIncoming = Object.keys(incoming).length > 0;
  const isOrganic = !hasIncoming;
  const referrer = document.referrer || "";

  const touch: Touch = {
    ...incoming,
    ts: Date.now(),
    landing_path: window.location.pathname,
    referrer,
  };

  // Infer source for organic landings if no UTMs present
  if (isOrganic && referrer) {
    try {
      const refHost = new URL(referrer).hostname.replace(/^www\./, "");
      if (refHost && !refHost.endsWith("ptlaunchlab.co.uk")) {
        touch.utm_source = refHost;
        touch.utm_medium = "referral";
      }
    } catch {
      // ignore malformed referrer
    }
  }

  if (!readTouch(FIRST_TOUCH_KEY)) {
    writeTouch(FIRST_TOUCH_KEY, touch);
  }
  // Last-touch only updates when there's a real signal (UTM or external referrer)
  if (hasIncoming || (isOrganic && touch.utm_source)) {
    writeTouch(LAST_TOUCH_KEY, touch);
  }
}

function pushEvent(name: string, props: Record<string, unknown>) {
  const first = readTouch(FIRST_TOUCH_KEY);
  const last = readTouch(LAST_TOUCH_KEY);
  const enriched = {
    event: name,
    page_path: window.location.pathname,
    page_referrer: document.referrer,
    first_touch_source: first?.utm_source ?? "(direct)",
    first_touch_medium: first?.utm_medium ?? "(none)",
    first_touch_campaign: first?.utm_campaign ?? "(none)",
    last_touch_source: last?.utm_source ?? "(direct)",
    last_touch_medium: last?.utm_medium ?? "(none)",
    last_touch_campaign: last?.utm_campaign ?? "(none)",
    ...props,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(enriched);
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, enriched);
  }
}

function ctaTextFrom(el: HTMLElement): string {
  const text = el.innerText?.trim() || el.getAttribute("aria-label") || "";
  return text.replace(/\s+/g, " ").slice(0, 80);
}

function ctaLocationFrom(el: HTMLElement): string {
  const section = el.closest("section");
  if (!section) return "unknown";
  const heading = section.querySelector("h1, h2, h3");
  if (heading?.textContent) {
    return heading.textContent.trim().replace(/\s+/g, " ").slice(0, 60);
  }
  return "unknown";
}

export default function Tracking() {
  const pathname = usePathname();

  // Meta Pixel PageView on every pathname change. The Pixel snippet in
  // app/layout.tsx no longer fires its own PageView — we own it here so the
  // first hard load AND every Next.js <Link> SPA navigation get tracked.
  //
  // The Pixel base snippet loads `afterInteractive`, which can lose the race
  // against this effect on a hard page load. When it does, `window.fbq` is
  // still undefined and the old guarded call silently dropped the PageView
  // forever — the effect only re-runs on a pathname change, so a single-page
  // bounce never retried. That race is why production Lead events (fired in
  // user handlers, seconds later, once fbq is ready) registered fine while
  // PageView barely fired at all. Retry briefly until fbq is available.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const firePageView = () => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        return;
      }
      if (tries++ < 50) timer = setTimeout(firePageView, 100); // up to ~5s
    };
    firePageView();
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    captureUtms();

    // CTA click tracking — anchor tags pointing to conversion paths
    const ctaSelector =
      'a[href="/enrol"], a[href^="/enrol?"], a[href="/book-call"], a[href^="/book-call?"], a[href="/quiz"], a[href^="/quiz?"], a[href^="https://wa.me/"], a[href^="tel:"], a[data-cta]';

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest(ctaSelector) as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      let ctaTarget = "other";
      if (href.startsWith("/enrol")) ctaTarget = "enrol";
      else if (href.startsWith("/book-call")) ctaTarget = "book_call";
      else if (href.startsWith("/quiz")) ctaTarget = "quiz";
      else if (href.startsWith("https://wa.me/")) ctaTarget = "whatsapp";
      else if (href.startsWith("tel:")) ctaTarget = "phone";

      pushEvent("cta_clicked", {
        cta_text: ctaTextFrom(anchor),
        cta_location: ctaLocationFrom(anchor),
        cta_target: ctaTarget,
        cta_href: href,
      });

      if (ctaTarget === "phone") {
        pushEvent("phone_number_clicked", {
          link_location: ctaLocationFrom(anchor),
        });
      }
      if (ctaTarget === "whatsapp") {
        pushEvent("whatsapp_link_clicked", {
          link_location: ctaLocationFrom(anchor),
        });
      }
    };

    document.addEventListener("click", handleClick, { capture: true });

    // Scroll depth tracking — 25/50/75/90 once per page load
    const fired = new Set<number>();
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const total = (doc.scrollHeight || 0) - (window.innerHeight || 0);
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / total) * 100));
      SCROLL_DEPTHS.forEach((depth) => {
        if (pct >= depth && !fired.has(depth)) {
          fired.add(depth);
          pushEvent("scroll_depth_reached", {
            depth_percent: depth,
            page_type: window.location.pathname,
          });
        }
      });
    };

    let scrollTicking = false;
    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        handleScroll();
        scrollTicking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
