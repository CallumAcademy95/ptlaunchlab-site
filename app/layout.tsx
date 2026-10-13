import type { Metadata } from "next";
import { Poppins, Barlow_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Chatbot from "./components/ChatbotLazy";
import Tracking from "./components/Tracking";
import { CallModalProvider } from "./components/cta/CallModal";
import { siteSchema } from "@/app/lib/siteSchema";
import "./globals.css";

// Fonts: every weight below renders somewhere on the site (checked with a
// Playwright sweep of all 105 sitemap + funnel pages at 390 and 1366 px), so
// none can be dropped without a visible weight change. Above the fold on the
// home page (390 px) only Poppins 400/600/700 and Barlow 800 render.
// next/font can only preload per family call, not per weight, and both
// families are needed above the fold (H1 = Barlow 800; body, price and
// buttons = Poppins 400/600/700). Turning Poppins' preload off was measured
// (Lighthouse mobile, 3 runs): LCP and Speed Index got worse (later swap), so
// both stay preloaded. See the perf report of 12 Oct 2026.
// Keep the weight lists in step with tests/perfTracking.test.mts.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  preload: true,
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
      "NCFE Level 3 PT qualification, 100% online. Built by gym owners who've hired 500+ trainers. Ofqual regulated, CIMSPA recognised, a guaranteed gym introduction.",
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
      {/* No hand-written hero preload: the home hero's next/image `priority`
          emits its own preload for the optimised, correctly sized image. A raw
          /learner-1.webp preload here fetched the full-size file a second time,
          on every page. */}
      <body className={`${poppins.variable} ${barlowCondensed.variable} antialiased`}>
        {/* Organization JSON-LD (EducationalOrganization + LocalBusiness +
            WebSite graph), built in app/lib/siteSchema.ts. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
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
        <CallModalProvider>{children}</CallModalProvider>
        <Tracking />
        <Chatbot />
        <Analytics />
        {/* 3. Google Analytics 4 — gtag.js (~180 KB, ~0.8 s of main thread on
            a mid phone) loads only after window load + an idle slot, so it
            stays out of the LCP render. Nothing is lost meanwhile: the consent
            script above defined the gtag() stub, so every gtag()/dataLayer push
            made before this (trackEvent, Tracking.tsx, CookieYes's consent
            update) queues in window.dataLayer and gtag.js replays the queue
            in order when it arrives.
            The 'js' and 'config' commands are queued HERE, during HTML parse
            (a dataLayer push, no network, no cost), not when gtag.js is
            fetched: gtag.js drops any queued event that sits before the
            config command, so a CTA click before window.load would otherwise
            be lost (verified with Playwright on a slow load).
            A plain inline <script> (not next/script) so it runs during HTML
            parse and never gets a preload hint. */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  window.dataLayer=window.dataLayer||[];
  var g=window.gtag||function(){window.dataLayer.push(arguments);};
  g('js',new Date());
  g('config','G-90W2KGSL55',{anonymize_ip:true});
  function loadGa(){
    if(window.__ptllGaLoaded) return; window.__ptllGaLoaded=true;
    var s=document.createElement('script');s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id=G-90W2KGSL55';
    document.head.appendChild(s);
  }
  function whenIdle(){
    if('requestIdleCallback' in window) window.requestIdleCallback(loadGa,{timeout:2000});
    else setTimeout(loadGa,2000);
  }
  if(document.readyState==='complete') whenIdle();
  else window.addEventListener('load',whenIdle,{once:true});
})();
        `}} />
        {/* 4. Microsoft Clarity — loads ONLY after CookieYes analytics consent
            (same gate as the Meta Pixel below, category "analytics"), and
            never before window load. No consent, no clarity.ms request. */}
        <Script id="microsoft-clarity" strategy="afterInteractive">{`
          (function(){
            function ok(c){ if(!c||typeof c!=='object') return false;
              if(c.categories&&c.categories.analytics===true) return true;
              return Array.isArray(c.accepted)&&c.accepted.indexOf('analytics')>-1; }
            function inject(){
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "w0qwj7lviw");
            }
            window.__ptllLoadClarity=function(){
              if(window.__ptllClarityLoaded) return; window.__ptllClarityLoaded=true;
              if(document.readyState==='complete') inject();
              else window.addEventListener('load',inject,{once:true});
            };
            document.addEventListener('cookieyes_consent_update',function(e){
              if(ok(e&&e.detail)) window.__ptllLoadClarity(); });
            document.addEventListener('cookieyes_banner_load',function(){
              try{ if(ok(window.getCkyConsent&&window.getCkyConsent())) window.__ptllLoadClarity(); }catch(_){}
            });
            try{ if(ok(window.getCkyConsent&&window.getCkyConsent())) window.__ptllLoadClarity(); }catch(_){}
          })();
        `}</Script>
        {/* 5. Meta Pixel — loads ONLY after CookieYes advertisement consent
            (PECR). Before consent, window.fbq is a no-op so callers never
            throw. Tracking.tsx owns PageView (mount + route changes): while
            fbq is the no-op it sets window.__ptllPvPending, and the loader
            fires one PageView on load only if that flag is set, so the
            first page is never counted twice. */}
        <Script id="meta-pixel" strategy="afterInteractive">{`
          (function(){
            var noop=function(){}; noop.__ptllNoop=true;
            if(!window.fbq) window.fbq=noop;
            function ok(c){ if(!c||typeof c!=='object') return false;
              if(c.categories&&c.categories.advertisement===true) return true;
              return Array.isArray(c.accepted)&&c.accepted.indexOf('advertisement')>-1; }
            window.__ptllLoadPixel=function(){
              if(window.__ptllPixelLoaded) return; window.__ptllPixelLoaded=true;
              if(window.fbq&&window.fbq.__ptllNoop) delete window.fbq;
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','1133525198707842');
              if(window.__ptllPvPending){ window.__ptllPvPending=false; fbq('track','PageView'); }
            };
            document.addEventListener('cookieyes_consent_update',function(e){
              if(ok(e&&e.detail)) window.__ptllLoadPixel(); });
            document.addEventListener('cookieyes_banner_load',function(){
              try{ if(ok(window.getCkyConsent&&window.getCkyConsent())) window.__ptllLoadPixel(); }catch(_){}
            });
            try{ if(ok(window.getCkyConsent&&window.getCkyConsent())) window.__ptllLoadPixel(); }catch(_){}
          })();
        `}</Script>
      </body>
    </html>
  );
}
