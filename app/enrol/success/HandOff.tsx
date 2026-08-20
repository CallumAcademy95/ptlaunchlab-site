import Link from "next/link";
import { PHONE_NATIONAL } from "@/app/lib/contactDetails";

// The page a buyer lands on straight after Stripe. The learner record lives on
// Praxel now, so this page's whole job is to hand them over cleanly.
//
// `enrolUrl` is built on the server, because the signing secret must never
// reach the browser. When it could not be built — an unreadable session, a
// missing secret — `signed` is false and the copy points at the email instead,
// which always carries a valid link and is the more reliable path anyway.
export default function HandOff({ enrolUrl, signed }: { enrolUrl: string; signed: boolean }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-white/10 bg-deep p-8 sm:p-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          Payment received
        </div>

        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Your place is confirmed</h1>

        {signed ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-soft">
              One more step: create your account. You&apos;ll set a password, give us your NCFE learner details and
              sign your learner agreement — about five minutes. Your course opens as soon as you&apos;re done.
            </p>

            <div className="mt-8">
              <Link
                href={enrolUrl}
                className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-extrabold text-base transition-opacity hover:opacity-90"
              >
                Create my account →
              </Link>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-faint">
              We&apos;ve emailed you this link too, so you can finish later if now isn&apos;t convenient. It&apos;s
              tied to your payment and works once.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-soft">
              One more step: create your account. We&apos;ve just emailed you a personal link to do it — check your
              inbox, and your spam folder if it isn&apos;t there.
            </p>
            <p className="mt-6 text-xs leading-relaxed text-faint">
              Nothing has gone wrong with your payment. The link has to come by email because it&apos;s tied to your
              purchase.
            </p>
          </>
        )}

        <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-faint">
          Any problems, email{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
            info@ptlaunchlab.co.uk
          </a>{" "}
          or call <span className="font-semibold text-white">{PHONE_NATIONAL}</span>.
        </p>
      </div>
    </main>
  );
}
