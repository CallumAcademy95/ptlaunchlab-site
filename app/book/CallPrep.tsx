"use client";
// The confirmation state after booking a course call: prepare for the call, don't
// sell. Copy lives in app/lib/booking/callPrep.ts (tested against the copy rules).
// The video block only renders when NEXT_PUBLIC_CALL_PREP_VIDEO_URL is set to a
// YouTube link or an https video file; unset means no block at all.
import { useEffect, useRef } from "react";
import { CALLER_DISPLAY, WHATSAPP_LINK } from "@/app/lib/contactDetails";
import { PREP_COPY as C, callPrepVideo, whatsappMoveHref } from "@/app/lib/booking/callPrep";

const VIDEO = callPrepVideo(process.env.NEXT_PUBLIC_CALL_PREP_VIDEO_URL);
const CALLER_TEL = `+44${CALLER_DISPLAY.replace(/\s/g, "").replace(/^0/, "")}`;

export default function CallPrep({ label, phone, manageUrl }: { label: string; phone: string; manageUrl: string | null }) {
  const top = useRef<HTMLDivElement>(null);
  // The form it replaces can be a long way down the page (the Career Planner), so
  // bring the confirmation into view.
  useEffect(() => { top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  const manageToken = manageUrl ? manageUrl.split("/").pop() : null;

  return (
    <div ref={top} id="call-prep" className="grid gap-4 scroll-mt-28">
      <section className="bg-card border border-gold/40 rounded-2xl p-5 sm:p-6" aria-labelledby="prep-heading">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{C.eyebrow}</p>
        <h2 id="prep-heading" className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight mb-3">{C.heading}</h2>
        <p className="text-white text-lg font-semibold leading-snug mb-1">{label}</p>
        <p className="text-soft/70 text-sm mb-4">UK time</p>
        <p className="text-soft/85 mb-3">{C.whoLine(phone)}</p>
        <p className="text-soft/70 text-sm mb-5">{C.saveNumber}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={`tel:${CALLER_TEL}`} className="text-center px-4 py-3 rounded-full border border-white/25 text-white font-semibold text-sm">
            {CALLER_DISPLAY}
          </a>
          {manageToken && (
            <a href={`/api/booking/ics?token=${manageToken}`} className="text-center px-4 py-3 rounded-full bg-gold text-deep font-bold text-sm">
              {C.calendarLink}
            </a>
          )}
        </div>
      </section>

      {VIDEO && (
        <section className="bg-card border border-white/10 rounded-2xl p-3 sm:p-4" aria-labelledby="prep-video">
          <h3 id="prep-video" className="text-white font-bold text-base px-2 pt-1 pb-3">{C.videoHeading}</h3>
          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
            {VIDEO.kind === "youtube" ? (
              // /book/* sends no referrer by default, which YouTube embeds reject.
              // strict-origin sends only the site origin, never the page path.
              <iframe
                className="absolute inset-0 w-full h-full"
                src={VIDEO.src}
                title={C.videoHeading}
                referrerPolicy="strict-origin"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <video className="absolute inset-0 w-full h-full" src={VIDEO.src} controls playsInline preload="metadata" />
            )}
          </div>
        </section>
      )}

      <section className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6" aria-labelledby="prep-agenda">
        <h3 id="prep-agenda" className="font-display font-extrabold text-xl text-white mb-1">{C.agendaHeading}</h3>
        <p className="text-soft/75 text-sm mb-4">{C.agendaIntro}</p>
        <ol className="grid gap-4">
          {C.agenda.map((a, i) => (
            <li key={a.title} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-gold/20 text-gold font-bold text-sm flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="text-white font-semibold">{a.title}</p>
                <p className="text-soft/80 text-sm leading-relaxed">{a.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6" aria-labelledby="prep-prepare">
        <h3 id="prep-prepare" className="font-display font-extrabold text-xl text-white mb-3">{C.prepareHeading}</h3>
        <ul className="grid gap-3">
          {C.prepare.map((p) => (
            <li key={p} className="flex gap-3 text-soft/85 text-sm leading-relaxed">
              <span aria-hidden="true" className="text-gold font-bold">✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6" aria-labelledby="prep-move">
        <h3 id="prep-move" className="font-display font-extrabold text-xl text-white mb-2">{C.moveHeading}</h3>
        <p className="text-soft/80 text-sm mb-4">{C.moveBody}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {manageUrl && (
            <a href={manageUrl} className="text-center px-4 py-3 rounded-full border border-white/25 text-white font-semibold text-sm">{C.moveLink}</a>
          )}
          <a href={whatsappMoveHref(WHATSAPP_LINK, label)} target="_blank" rel="noopener noreferrer"
            className="text-center px-4 py-3 rounded-full border border-white/25 text-white font-semibold text-sm">{C.whatsappLink}</a>
        </div>
      </section>
    </div>
  );
}
