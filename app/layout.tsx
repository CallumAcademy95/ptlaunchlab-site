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
  metadataBase: new URL("https://ptlaunchlab.co.uk"),
  title: "PT Launch Lab — Become a Qualified Personal Trainer",
  description:
    "Get your NCFE Level 3 PT qualification online in as little as 8 weeks, with real mentorship and business support to launch your career.",
  openGraph: {
    type: "website",
    siteName: "PT Launch Lab",
    title: "PT Launch Lab — Become a Qualified Personal Trainer",
    description:
      "NCFE Level 3 PT qualification, 100% online. Built by gym owners who've hired 500+ trainers. Ofqual regulated, CIMSPA recognised, guaranteed gym interviews.",
    url: "https://ptlaunchlab.co.uk",
    images: [
      {
        url: "/podcast-thumbnail.jpg",
        width: 480,
        height: 480,
        alt: "PT Launch Lab — Become a Qualified Personal Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PT Launch Lab — Become a Qualified Personal Trainer",
    description:
      "NCFE Level 3 PT qualification, 100% online. Built by gym owners who've hired 500+ trainers. Ofqual regulated, CIMSPA recognised.",
    images: ["/podcast-thumbnail.jpg"],
  },
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
        {/* Organization JSON-LD schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PT Launch Lab",
              url: "https://ptlaunchlab.co.uk",
              logo: "https://ptlaunchlab.co.uk/logo.png",
              description:
                "NCFE Level 3 Personal Trainer qualification, 100% online, built by gym owners. Ofqual regulated, CIMSPA recognised. Business mentorship and guaranteed gym interviews included.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Pontefract",
                addressRegion: "West Yorkshire",
                addressCountry: "GB",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "17",
                bestRating: "5",
                worstRating: "1",
              },
              sameAs: [
                "https://www.youtube.com/@ptlaunchlab",
                "https://www.instagram.com/ptlaunchlab",
              ],
            }),
          }}
        />
        {/* 1. Consent Mode v2 defaults — true inline script, runs synchronously before any async scripts */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: `
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:2000});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
        `}} />
        {/* 2. CookieYes — reads consent defaults above, updates them on user choice */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/04abe099864c49fd5daf17ec/script.js"
          strategy="afterInteractive"
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
        {/* 4. Meta Pixel — fires after consent via CookieYes */}
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1988881834762642');
          fbq('track', 'PageView');
        `}</Script>
      </body>
    </html>
  );
}
