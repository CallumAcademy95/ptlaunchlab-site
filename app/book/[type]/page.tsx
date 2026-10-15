import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { CALL_TYPES, callTypeFromSlug } from "@/app/lib/booking/callTypes";
import { verifyLinkToken } from "@/app/lib/booking/tokens";
import { loadPrefill } from "@/app/lib/booking/data";
import BookingFlow from "../BookingFlow";

const nowMs = () => Date.now();

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a call | PT Launch Lab", robots: { index: false } };

export default async function BookPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ t?: string }> }) {
  const { type } = await params;
  const { t } = await searchParams;
  const callType = callTypeFromSlug(type);
  if (!callType) notFound();
  const tok = t ? verifyLinkToken(t, process.env.BOOKING_LINK_SECRET ?? "", nowMs()) : null;
  const prefill = tok && tok.callType === callType ? await loadPrefill(tok.leadId) : null;
  const def = CALL_TYPES[callType];
  return (
    <>
      <Nav />
      <main className="bg-base min-h-screen px-4 py-10 md:py-16">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-2">{def.title}</h1>
          <p className="text-soft/70 mb-8">{def.minutes} minutes. Callum will ring you at the time you pick.</p>
          <BookingFlow callType={callType} questions={def.questions} prefill={prefill} token={tok ? t! : null} />
        </div>
      </main>
      <Footer />
    </>
  );
}
