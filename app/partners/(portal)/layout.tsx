import type { Metadata } from "next";
import { requirePartner } from "@/app/lib/partner-auth";
import { partnerSignOut } from "../actions";
import PartnerNav from "./PartnerNav";
import { PHONE_NATIONAL, PHONE_TEL } from "@/app/lib/contactDetails";

export const metadata: Metadata = {
  title: "Partner portal — PT Launch Lab",
  robots: { index: false, follow: false },
};

// Every page here is per-partner. Nothing in the portal may be cached or
// prerendered — a shared cache entry would be a cross-partner data leak.
export const dynamic = "force-dynamic";

/**
 * The portal shell. Login and set-password deliberately live OUTSIDE this route
 * group: they render full-screen with no nav, and set-password must not be
 * wrapped by a layout whose requirePartner() would redirect back to it.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePartner();
  const { partner } = session;

  return (
    <div className="min-h-screen bg-deep">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase">
              PT Launch Lab · Partner Portal
            </p>
            <h1 className="text-white font-bold text-lg truncate">{partner.gym_name}</h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:block text-soft text-xs truncate max-w-[200px]">
              {session.fullName || session.email}
            </span>
            <form action={partnerSignOut}>
              <button
                type="submit"
                className="text-soft text-xs font-semibold hover:text-gold transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <PartnerNav />

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="mx-auto max-w-5xl px-6 py-8 text-soft text-xs">
        Questions about your partnership?{" "}
        <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
          info@ptlaunchlab.co.uk
        </a>{" "}
        · <a href={`tel:${PHONE_TEL}`} className="text-gold hover:underline">{PHONE_NATIONAL}</a>
      </footer>
    </div>
  );
}
