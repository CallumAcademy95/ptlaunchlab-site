import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PT Launch Lab — Become a Qualified Personal Trainer",
  description:
    "Get your NCFE Level 3 PT qualification online in as little as 8 weeks, with real mentorship and business support to launch your career.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${poppins.variable} antialiased`}>
        {/* 1. Consent Mode v2 defaults — fires before any other scripts */}
        <Script id="consent-defaults" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted',
            wait_for_update: 2000
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('set', 'url_passthrough', true);
        `}</Script>
        {/* 2. CookieYes — reads consent defaults above, updates them on user choice */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/04abe099864c49fd5daf17ec/script.js"
          strategy="beforeInteractive"
        />
        {children}
        <Analytics />
        {/* 3. Google Analytics 4 — loads after consent is established */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-90W2KGSL55" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-90W2KGSL55', { anonymize_ip: true });
        `}</Script>
      </body>
    </html>
  );
}
