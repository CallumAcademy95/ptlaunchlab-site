import type { NextConfig } from "next";

// Domains allowed to serve scripts
const SCRIPT_HOSTS = [
  "cdn-cookieyes.com",          // CookieYes consent banner
  "*.cookieyes.com",
  "www.googletagmanager.com",   // Google Analytics 4
  "connect.facebook.net",       // Meta Pixel
  "www.clarity.ms",             // Microsoft Clarity
  "assets.calendly.com",        // Calendly booking widget
  "va.vercel-scripts.com",      // Vercel Analytics
].join(" ");

// Domains the browser can fetch/XHR to
const CONNECT_HOSTS = [
  "www.google-analytics.com",   // GA4 beacons
  "analytics.google.com",
  "stats.g.doubleclick.net",
  "www.facebook.com",           // Meta Pixel events
  "*.clarity.ms",               // Clarity telemetry
  "cdn-cookieyes.com",          // CookieYes
  "*.cookieyes.com",
  "log.cookieyes.com",
  "vitals.vercel-insights.com", // Vercel Web Vitals
  "calendly.com",               // Calendly API
].join(" ");

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' required: inline scripts in layout (JSON-LD, gtag consent defaults,
  // GA4 init, Clarity init, Meta Pixel init). Next.js Script strategy="afterInteractive"
  // also injects inline wrappers. Remove if nonce-based CSP is added in future.
  `script-src 'self' 'unsafe-inline' ${SCRIPT_HOSTS}`,
  // 'unsafe-inline' required: Tailwind utility classes and Next.js style injection
  `style-src 'self' 'unsafe-inline' assets.calendly.com`,
  // data: for signature canvas; blob: for PDF generation; https: for tracking pixels
  // (Meta, GA, Clarity serve 1x1 tracking images from many CDN subdomains)
  "img-src 'self' data: blob: https:",
  // Next.js serves Google Fonts locally at build time — no external font host needed
  "font-src 'self' data:",
  `connect-src 'self' ${CONNECT_HOSTS}`,
  // YouTube embeds (4 pages) + Calendly booking
  "frame-src www.youtube.com calendly.com",
  // Block Flash, PDFs in plugin context, and other object embeds
  "object-src 'none'",
  // Prevent base-tag injection attacks
  "base-uri 'self'",
  // Prevent forms being submitted to external domains
  "form-action 'self'",
  // Prevent this site being embedded in external iframes (clickjacking)
  "frame-ancestors 'none'",
  // Force any remaining http: asset requests to https:
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Superseded by frame-ancestors in CSP for modern browsers;
            // kept for legacy browser compatibility
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: CSP,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
