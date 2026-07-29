import type { Metadata } from "next";
import Link from "next/link";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password — PT Launch Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen [height:100dvh] bg-deep flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">
            PT Launch Lab
          </p>
          <h1 className="text-white font-bold text-2xl">Reset your password</h1>
          <p className="text-soft text-sm mt-2">
            Put in the email you sign in with and we&rsquo;ll send you a link.
          </p>
        </div>

        <ForgotForm />

        <p className="text-center text-soft text-xs mt-8">
          <Link href="/partners/login" className="hover:text-gold">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
