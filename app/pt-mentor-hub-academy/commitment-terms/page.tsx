import type { Metadata } from "next";
import Link from "next/link";
import { COMMITMENT_TERMS } from "@/app/lib/mentorPackageAgreement";

// The public terms of PT Mentor Hub's "earn back your investment" Commitment.
// Rendered from COMMITMENT_TERMS, which is also Schedule 1 of the signed
// Mentor Package Partner Agreement: the two are the same text by construction.

export const metadata: Metadata = {
  title: "Commitment Terms | PT Mentor Hub Academy",
  description: "The terms of PT Mentor Hub's commitment to keep mentoring you until you earn back your investment.",
  robots: { index: false, follow: false },
};

const ORANGE = "#DB4A2B";

export default function CommitmentTermsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-14 md:py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/pt-mentor-hub-academy" className="text-sm text-white/60 hover:text-white">← PT Mentor Hub Academy</Link>
        <p className="text-xs font-bold uppercase tracking-widest mt-10 mb-3" style={{ color: ORANGE }}>Our commitment</p>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-none tracking-tight mb-6">Commitment terms</h1>
        <p className="text-white/75 leading-relaxed mb-10">
          &ldquo;If you don&apos;t earn back your investment within your first three months as a PT, we continue mentoring you for free until you do.&rdquo; These are the terms that commitment is given on.
        </p>
        <dl className="space-y-6">
          {COMMITMENT_TERMS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <dt className="font-bold mb-1.5">{t.title}</dt>
              <dd className="text-sm text-white/70 leading-relaxed">{t.text}</dd>
            </div>
          ))}
        </dl>
      </div>
      <footer className="max-w-2xl mx-auto mt-14 pt-6 border-t border-white/10 text-xs text-white/40">
        PT Mentor Hub Academy · Qualification delivered by PT Launch Lab, NCFE Accredited Centre No. 9002788
      </footer>
    </div>
  );
}
