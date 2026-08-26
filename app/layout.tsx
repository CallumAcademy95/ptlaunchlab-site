import type { Metadata } from "next";
import { Poppins, Barlow_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Chatbot from "./components/ChatbotLazy";
import Tracking from "./components/Tracking";
import { PHONE_SCHEMA } from "@/app/lib/contactDetails";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ptlaunchlab.co.uk"),
  title: "PT Launch Lab — Become a Qualified Personal Trainer",
  description:
    "Get your NCFE Level 3 PT qualification online in as little as 8 weeks, with real mentorship and business support to launch your career.",
  verification: {
    other: {
      "facebook-domain-verification": "vwepg3x20z4pmksvkubk7v1vzinalg",
    },
  },
  openGraph: {
    type: "website",
    siteName: "PT Launch Lab",
    title: "PT Launch Lab — Become a Qualified Personal Trainer",
    description:
      "NCFE Level 3 PT qualification, 100% online. Built by gym owners who've hired 500+ trainers. Ofqual regulated, CIMSPA recognised, a guaranteed gym interview.",
    url: "https://ptlaunchlab.co.uk",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PT Launch Lab — Become a Qualified Personal Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PT Launch Lab — Become a Qualified Personal Trainer",
    description:
      "NCFE Level 3 PT qualification, 100% online. Built by gym owners who've hired 500+ trainers. Ofqual regulated, CIMSPA recognised.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload first hero slide on desktop only — on mobile the image is
            below the fold (single column, image follows the H1), so a
            high-priority preload there steals bandwidth from CSS and pushes
            FCP back. fetchPriority "high" removed for the same reason —
            "auto" lets the browser balance against CSS/font requests. */}
        <link
          rel="preload"
          as="image"
          href="/learner-1.webp"
          type="image/webp"
          media="(min-width: 1024px)"
        />
      </head>
      <body className={`${poppins.variable} ${barlowCondensed.variable} antialiased`}>
        {/* Organization JSON-LD schema — graph with EducationalOrganization
            (the brand/course provider) + LocalBusiness (the Pontefract HQ)
            so Google can populate both knowledge panels and local SERPs. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "EducationalOrganization",
                  "@id": "https://ptlaunchlab.co.uk/#org",
                  name: "PT Launch Lab",
                  alternateName: "PT Launch Lab Ltd",
                  url: "https://ptlaunchlab.co.uk",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://ptlaunchlab.co.uk/logo.png",
                    width: 512,
                    height: 512,
                  },
                  image: "https://ptlaunchlab.co.uk/og-image.png",
                  description:
                    "NCFE Level 3 Personal Trainer qualification, 100% online, built by gym owners. Ofqual regulated, CIMSPA recognised. Business mentorship and a guaranteed gym interview included.",
                  foundingDate: "2024",
                  founders: [
                    { "@type": "Person", name: "Callum Brown" },
                    { "@type": "Person", name: "Ryan Robinson" },
                  ],
                  email: "info@ptlaunchlab.co.uk",
                  telephone: PHONE_SCHEMA,
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: "Unit 3, Royals Business Park, King Street",
                    addressLocality: "Pontefract",
                    addressRegion: "West Yorkshire",
                    postalCode: "WF8 4AH",
                    addressCountry: "GB",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "United Kingdom",
                  },
                  hasCredential: {
                    "@type": "EducationalOccupationalCredential",
                    name: "NCFE Level 2 & 3 Personal Trainer Qualification",
                    credentialCategory: "certificate",
                    educationalLevel: "Level 3",
                    recognizedBy: [
                      { "@type": "Organization", name: "Ofqual" },
                      { "@type": "Organization", name: "CIMSPA" },
                      { "@type": "Organization", name: "NCFE" },
                    ],
                  },
                  sameAs: [
                    "https://www.youtube.com/@ptlaunchlab",
                    "https://www.instagram.com/ptlaunchlab",
                    "https://www.tiktok.com/@pt.launch.lab",
                    "https://www.facebook.com/profile.php?id=61583011678458",
                    "https://find-and-update.company-information.service.gov.uk/company/16596168",
                  ],
                },
                {
                  "@type": "LocalBusiness",
                  "@id": "https://ptlaunchlab.co.uk/#localbusiness",
                  name: "PT Launch Lab",
                  url: "https://ptlaunchlab.co.uk",
                  image: "https://ptlaunchlab.co.uk/og-image.png",
                  telephone: PHONE_SCHEMA,
                  email: "info@ptlaunchlab.co.uk",
                  priceRange: "££",
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: "Unit 3, Royals Business Park, King Street",
                    addressLocality: "Pontefract",
                    addressRegion: "West Yorkshire",
                    postalCode: "WF8 4AH",
                    addressCountry: "GB",
                  },
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: 53.6917,
                    longitude: -1.3104,
                  },
                  openingHoursSpecification: [
                    {
                      "@type": "OpeningHoursSpecification",
                      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      opens: "09:00",
                      closes: "17:00",
                    },
                  ],
                  parentOrganization: { "@id": "https://ptlaunchlab.co.uk/#org" },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://ptlaunchlab.co.uk/#website",
                  url: "https://ptlaunchlab.co.uk",
                  name: "PT Launch Lab",
                  publisher: { "@id": "https://ptlaunchlab.co.uk/#org" },
                  inLanguage: "en-GB",
                },
              ],
            }),
          }}
        />
        {/* 1. Consent Mode v2 defaults */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: `
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:2000});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
        `}} />
        {/* 2. CookieYes */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/04abe099864c49fd5daf17ec/script.js"
          strategy="afterInteractive"
        />
        {children}
        <Tracking />
        <Chatbot />
        <Analytics />
        {/* 3. Google Analytics 4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-90W2KGSL55" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-90W2KGSL55', { anonymize_ip: true });
        `}</Script>
        {/* 4. Microsoft Clarity — deferred to lazyOnload (fires after window
            load) to keep it off the critical path. Heatmap/session data is
            non-critical for early page interactions. */}
        <Script id="microsoft-clarity" strategy="lazyOnload">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "w0qwj7lviw");
        `}</Script>
        {/* 5. Meta Pixel — loaded afterInteractive so `fbq` is queued before
            any form can be submitted (forms on cached pages otherwise hit
            the typeof-guard while window.fbq is undefined under lazyOnload).
            PageView is fired by Tracking.tsx on every pathname change so
            Next.js SPA navigations are counted too — do NOT add a PageView
            call here. */}
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1133525198707842');
        `}</Script>
      </body>
    </html>
  );
}
