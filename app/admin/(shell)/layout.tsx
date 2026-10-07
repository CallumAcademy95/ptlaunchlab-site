import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ExternalLink } from "lucide-react";
import { AdminSidebarNav } from "./ui/AdminSidebarNav";
import { AdminMobileNav } from "./ui/AdminMobileNav";
import { SignOutButton } from "./ui/SignOutButton";
import { PhoneAlerts } from "./PhoneAlerts";

// The admin shell.
//
// Until now /admin was five unconnected pages you reached by typing the URL,
// which is why the referrals screen and the October campaign page were built
// and then never opened again. This is Praxel's arrangement: a dark rail that
// holds every destination, a quiet top bar over the content column, and one
// content width so every screen lines up with the last.
//
// It sits in a route group so /admin/login — the one page you see when you
// are NOT signed in — stays outside it. The group changes no URLs.

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Installable as "PTLL Admin" on a phone (for push alerts). Only this shell
// gets the manifest — the public site and /admin/login stay untouched.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/admin.webmanifest",
  icons: { apple: "/admin-apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "PTLL Admin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

// iOS Safari zooms the page into any focused field whose text is under 16px,
// and the admin's forms are mostly text-sm. Below md, every input, select and
// textarea in the shell is lifted to 16px; desktop keeps its sizes.
const PHONE_INPUTS =
  "max-md:[&_input]:text-[16px] max-md:[&_select]:text-[16px] max-md:[&_textarea]:text-[16px]";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} flex min-h-dvh bg-[#f6f8fb] text-slate-900 [font-family:var(--font-inter),ui-sans-serif,system-ui,sans-serif] ${PHONE_INPUTS}`}
    >
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-y-auto bg-slate-900 md:flex">
        <Link
          href="/admin/partners"
          className="flex items-center gap-2.5 border-t-[3px] border-[#F5C518] px-5 py-4 text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5C518] text-sm font-extrabold text-slate-900">
            PT
          </span>
          <span className="text-[15px] font-semibold tracking-tight">PT Launch Lab</span>
        </Link>
        <div className="px-3 pb-8">
          <AdminSidebarNav />
        </div>
        <div className="mt-auto px-3 pb-6">
          <PhoneAlerts />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* backdrop-blur makes this header the containing block for any
            position:fixed descendant — which is why AdminMobileNav portals
            its drawer to <body> rather than rendering it in here. The top
            padding keeps it clear of the notch when the PWA runs edge to edge. */}
        <header
          className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* WCAG 2.4.1 — visible only when focused. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <div className="flex h-14 items-center gap-2 px-4 md:h-auto md:gap-3 md:px-8 md:py-2.5">
            <AdminMobileNav />
            <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 md:hidden">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F5C518] text-[10px] font-extrabold text-slate-900">
                PT
              </span>
              Admin
            </span>
            <div className="flex-1" />
            {/* Icon-only on a phone: the label crowded the bar. */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              aria-label="View site"
              title="View site"
              className="inline-flex h-11 w-11 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:h-auto md:w-auto md:px-2.5 md:py-1.5"
            >
              <ExternalLink className="h-[18px] w-[18px] md:h-3.5 md:w-3.5" />
              <span className="hidden md:inline">View site</span>
            </a>
            <SignOutButton />
          </div>
        </header>

        <main
          id="main"
          className="min-w-0 flex-1 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-10 md:pt-8"
        >
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
