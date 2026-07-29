import type { Metadata } from "next";
import Link from "next/link";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password — PT Launch Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen [height:100dvh] bg-deep flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">
            PT Launch Lab
          </p>
          <h1 className="text-white font-bold text-2xl">Choose a new password</h1>
        </div>

        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-4 text-red-200 text-sm leading-relaxed">
            That link is missing its token — it may have been cut short by your email client.
            <Link href="/partners/forgot-password" className="block text-gold hover:underline mt-2">
              Request a new one
            </Link>
          </div>
        )}

        <p className="text-center text-soft text-xs mt-8">
          <Link href="/partners/login" className="hover:text-gold">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
