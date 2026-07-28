import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePartner } from "@/app/lib/partner-auth";
import SetPasswordForm from "./SetPasswordForm";

export const metadata: Metadata = {
  title: "Set your password — PT Launch Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  // allowPasswordChange stops requirePartner bouncing this page back to itself.
  const session = await requirePartner({ allowPasswordChange: true });

  // Someone who has already chosen their own password has no business here.
  if (!session.mustChangePassword) redirect("/partners");

  return (
    <div className="min-h-screen [height:100dvh] bg-deep flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">
            {session.partner.gym_name}
          </p>
          <h1 className="text-white font-bold text-2xl">Choose your password</h1>
          <p className="text-soft text-sm mt-2">
            You&rsquo;re signed in with the temporary password we emailed you. Pick your own to
            finish setting up.
          </p>
        </div>

        <SetPasswordForm />
      </div>
    </div>
  );
}
