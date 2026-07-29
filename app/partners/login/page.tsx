import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/app/lib/partner-auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Partner sign in — PT Launch Lab",
  robots: { index: false, follow: false },
};

// Session state differs per request, so this can never be statically rendered.
export const dynamic = "force-dynamic";

const UNAVAILABLE = "The partner portal is temporarily unavailable. Please try again shortly.";

// config-* variants all read the same to a partner; they differ only in the
// server log and the query string, which is what we diagnose from.
const NOTICES: Record<string, string> = {
  paused: "This partner account is paused. Contact info@ptlaunchlab.co.uk.",
  config: UNAVAILABLE,
  "config-key": UNAVAILABLE,
  "config-url": UNAVAILABLE,
  "config-both": UNAVAILABLE,
};

export default async function PartnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // Already signed in — don't make them log in twice.
  if (!error) {
    const session = await getPartnerSession();
    if (session) redirect("/partners");
  }

  const safeNext = next?.startsWith("/partners") && !next.startsWith("//") ? next : "/partners";
  const notice = error ? NOTICES[error] : undefined;

  return (
    <div className="min-h-screen [height:100dvh] bg-deep flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">
            PT Launch Lab
          </p>
          <h1 className="text-white font-bold text-2xl">Partner sign in</h1>
          <p className="text-soft text-sm mt-2">
            Your gym&rsquo;s academy link, resources, enrolments and payments.
          </p>
        </div>

        {notice && (
          <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-200 text-sm">
            {notice}
          </div>
        )}

        <LoginForm next={safeNext} />

        <p className="text-center mt-4">
          <Link href="/partners/forgot-password" className="text-soft text-xs hover:text-gold">
            Forgot your password?
          </Link>
        </p>

        <p className="text-center text-soft text-xs mt-8 leading-relaxed">
          Not set up yet? Email{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
            info@ptlaunchlab.co.uk
          </a>
          <br />
          <Link href="/" className="hover:text-gold inline-block mt-3">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
