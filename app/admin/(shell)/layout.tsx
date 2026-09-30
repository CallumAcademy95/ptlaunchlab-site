import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ExternalLink } from "lucide-react";
import { AdminSidebarNav } from "./ui/AdminSidebarNav";
import { AdminMobileNav } from "./ui/AdminMobileNav";
import { SignOutButton } from "./ui/SignOutButton";

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

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} flex min-h-dvh bg-[#f6f8fb] text-slate-900 [font-family:var(--font-inter),ui-sans-serif,system-ui,sans-serif]`}
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          {/* WCAG 2.4.1 — visible only when focused. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-blue-700 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <div className="flex items-center gap-3 px-4 py-2.5 md:px-8">
            <AdminMobileNav />
            <span className="text-sm font-semibold text-slate-700 md:hidden">Admin</span>
            <div className="flex-1" />
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </a>
            <SignOutButton />
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 pb-10 pt-5 md:px-8 md:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
