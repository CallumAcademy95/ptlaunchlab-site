"use client";
// Career Planner v2: nine intent questions → name/email/mobile/consent gate →
// server-computed plan. No income forecast; mentorship described, not named.
import { useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ObjectionCapture from "../components/ObjectionCapture";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";
import { QUESTIONS, REGIONS, CONSENT_TEXT, type PlannerAnswers, type CareerPlanV2 } from "@/app/lib/careerPlannerV2";

type ChoiceKey = "why" | "job" | "goal" | "timeframe" | "blocker" | "hours" | "training" | "payment";
type StepKey = ChoiceKey | "location";
const STEPS: StepKey[] = ["why", "job", "goal", "timeframe", "blocker", "hours", "training", "location", "payment"];
type Draft = Partial<PlannerAnswers> & { blockerNote?: string | null };

const MENTORSHIP = [
  "A client profile worksheet to work out who you want to coach",
  "A 1:1 business call when you reach the business stage",
  "Recorded business training",
  "Live group Q&As",
  "Branded coaching templates: progress tracker, phase planner, logbook and meal planner",
];

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const INPUT = `w-full bg-deep border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-colors placeholder-white/25 ${FOCUS}`;

function readTouch(key: string): Record<string, string> | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export default function CareerPlanner() {
  const [phase, setPhase] = useState<"intro" | "steps" | "gate" | "results">("intro");
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState<Draft>({ blockerNote: null });
  const [lead, setLead] = useState({ firstName: "", surname: "", email: "", phone: "", consent: false });
  const [plan, setPlan] = useState<CareerPlanV2 | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const sec = useFormSecurity();
  const step = STEPS[idx];

  function begin() {
    if (!started.current) { started.current = true; trackEvent("career_planner_start", { version: 2 }); }
    setPhase("steps");
  }
  function answered(): boolean {
    if (step === "location") return !!draft.region && (draft.town ?? "").trim().length >= 2;
    return !!draft[step];
  }
  function next() {
    trackEvent("career_planner_step", { step_index: idx, step_key: step, version: 2 });
    if (idx < STEPS.length - 1) setIdx(idx + 1); else setPhase("gate");
  }
  function back() {
    if (phase === "gate") { setPhase("steps"); return; }
    if (idx > 0) setIdx(idx - 1);
  }

  async function submit() {
    if (submitting) return;
    setError(null);
    if (!lead.firstName.trim() || !lead.email.trim() || !lead.phone.trim()) { setError("Please fill in your first name, email and mobile."); return; }
    if (!lead.consent) { setError("Please tick the box so we can contact you about your plan."); return; }
    setSubmitting(true);
    const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "career_planner", currency: "GBP", value: 0 }, { eventID: eventId }); } catch {}
    const last = readTouch("ptll_last_touch") ?? readTouch("ptll_first_touch");
    try {
      const res = await fetch("/api/career-planner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: lead.firstName.trim(), surname: lead.surname.trim(), email: lead.email.trim().toLowerCase(),
          phone: lead.phone.trim(), consent: lead.consent, event_id: eventId,
          utm: last ? { source: last.utm_source, medium: last.utm_medium, campaign: last.utm_campaign, content: last.utm_content } : null,
          answers: { ...draft, blockerNote: draft.blocker === "other" ? (draft.blockerNote ?? null) : null },
          [sec.SEC_KEY]: sec.payload(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) { setError(j.error ?? "Something went wrong. Please try again."); return; }
      if (!j.lead || !j.plan) { setError("Something went wrong. Please try again."); return; }
      trackEvent("career_planner_complete", { version: 2, band: j.plan.band });
      setPlan(j.plan); setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Couldn't send that. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <Nav />
      <main className="pt-[72px] min-h-screen bg-deep">
        <div className="max-w-2xl mx-auto px-5 py-12 md:py-16">
          <sec.Honeypot />
          {phase === "intro" && <Intro onStart={begin} />}
          {phase === "steps" && (
            <div>
              <Progress current={idx + 1} total={STEPS.length} />
              <div className="bg-base border border-white/10 rounded-2xl p-6 md:p-8 mb-6">
                {step === "location" ? (
                  <div>
                    <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-4">Where are you based?</h2>
                    <label className="block text-soft text-sm mb-1" htmlFor="cp-region">Region</label>
                    <select id="cp-region" className={`${INPUT} mb-4`} value={draft.region ?? ""} onChange={(e) => setDraft({ ...draft, region: e.target.value })}>
                      <option value="">Choose your region</option>
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <label className="block text-soft text-sm mb-1" htmlFor="cp-town">Town or city</label>
                    <input id="cp-town" className={INPUT} maxLength={60} value={draft.town ?? ""} onChange={(e) => setDraft({ ...draft, town: e.target.value })} placeholder="e.g. Leeds" />
                  </div>
                ) : (
                  <div>
                    <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-5">{QUESTIONS[step].title}</h2>
                    <div className="grid grid-cols-1 gap-2.5">
                      {(QUESTIONS[step].options as readonly (readonly [string, string])[]).map(([value, label]) => (
                        <button key={value} id={`cp-${step}-${value}`} type="button" aria-pressed={draft[step] === value}
                          onClick={() => setDraft({ ...draft, [step]: value })}
                          className={`text-left rounded-xl px-4 py-3.5 border text-sm font-semibold transition-all ${FOCUS} ${draft[step] === value ? "border-gold bg-gold/10 text-white" : "border-white/10 text-soft hover:border-gold/40"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {step === "blocker" && draft.blocker === "other" && (
                      <textarea id="cp-blocker-note" aria-label="Tell us more (optional)" className={`${INPUT} mt-3`} maxLength={200} rows={2}
                        placeholder="Tell us more (optional)" value={draft.blockerNote ?? ""} onChange={(e) => setDraft({ ...draft, blockerNote: e.target.value })} />
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {idx > 0 && (
                  <button type="button" onClick={back} className={`px-6 py-3.5 rounded-full border border-white/15 text-soft font-semibold text-sm hover:border-white/30 transition-all ${FOCUS}`}>← Back</button>
                )}
                <button type="button" onClick={next} disabled={!answered()} className={`flex-1 py-3.5 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-40 ${FOCUS}`}>
                  {idx === STEPS.length - 1 ? "See my plan →" : "Continue →"}
                </button>
              </div>
            </div>
          )}
          {phase === "gate" && (
            <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="grid gap-3">
              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight">Where should we send your plan?</h2>
              <p className="text-soft">We&apos;ll email it now, and someone from the team will WhatsApp you about it. Real person, no spam.</p>
              <label htmlFor="cp-first" className="sr-only">First name</label>
              <input id="cp-first" name="firstName" required autoComplete="given-name" placeholder="First name" maxLength={40} className={INPUT} value={lead.firstName} onChange={(e) => setLead({ ...lead, firstName: e.target.value })} />
              <label htmlFor="cp-surname" className="sr-only">Surname (optional)</label>
              <input id="cp-surname" name="surname" autoComplete="family-name" placeholder="Surname (optional)" maxLength={60} className={INPUT} value={lead.surname} onChange={(e) => setLead({ ...lead, surname: e.target.value })} />
              <label htmlFor="cp-email" className="sr-only">Email address</label>
              <input id="cp-email" name="email" required type="email" autoComplete="email" placeholder="Email address" className={INPUT} value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
              <label htmlFor="cp-phone" className="sr-only">Mobile</label>
              <input id="cp-phone" name="phone" required type="tel" autoComplete="tel" placeholder="Mobile (07…)" className={INPUT} value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
              <label className="flex gap-3 items-start text-sm text-soft" htmlFor="cp-consent">
                <input id="cp-consent" type="checkbox" className={`mt-1 accent-[#F5C518] ${FOCUS}`} checked={lead.consent} onChange={(e) => setLead({ ...lead, consent: e.target.checked })} />
                <span>{CONSENT_TEXT} <a href="/privacy" className="underline">Privacy policy</a></span>
              </label>
              {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={back} className={`px-6 py-3.5 rounded-full border border-white/15 text-soft font-semibold text-sm hover:border-white/30 transition-all ${FOCUS}`}>← Back</button>
                <button type="submit" disabled={submitting} className={`flex-1 py-3.5 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 ${FOCUS}`}>{submitting ? "Building your plan…" : "Show my plan →"}</button>
              </div>
            </form>
          )}
          {phase === "results" && plan && <Results plan={plan} name={lead.firstName.trim()} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-7">
      <div className="flex justify-between items-center mb-2">
        <span className="text-faint text-xs font-semibold uppercase tracking-wide">Step {current} of {total}</span>
        <span className="text-gold text-xs font-bold">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">Free PT Career Plan</p>
      <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-none tracking-tight mb-4">Could personal training be your next career?</h1>
      <p className="text-soft text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">Answer 9 quick questions and get a plan built around your life: your route, your timeline, and what you&apos;d get to help you get there. Takes about two minutes.</p>
      <button type="button" onClick={onStart} className={`w-full sm:w-auto px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all ${FOCUS}`}>Build my career plan →</button>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-base border border-white/10 p-5">
      <h3 className="text-gold text-xs font-semibold uppercase tracking-widest mb-2">{label}</h3>
      <div className="text-soft leading-relaxed">{children}</div>
    </section>
  );
}

function Results({ plan, name }: { plan: CareerPlanV2; name: string }) {
  const t = plan.timeline;
  return (
    <div className="grid gap-4">
      <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight">Your PT Career Plan{name ? `, ${name}` : ""}</h1>
      <p className="text-gold text-xl">{plan.headline}</p>
      <Block label="Your goal">{plan.goal}</Block>
      <Block label="Your route">{plan.route}</Block>
      <Block label="Your timeline">
        <ul className="grid gap-1"><li><b>Start:</b> {t.start}</li><li><b>Qualify:</b> {t.qualify} <span className="text-faint">(the course takes 8–16 weeks)</span></li><li><b>Then:</b> {t.next}</li></ul>
      </Block>
      <Block label={`Your biggest concern: ${plan.concern.title}`}>{plan.concern.answer}</Block>
      <Block label="What you get">
        <p>NCFE Level 2 and Level 3, Ofqual regulated and CIMSPA recognised, studied online with a personal tutor.</p>
        <p className="mt-3 font-semibold">Business mentorship included:</p>
        <ul className="list-disc pl-5 mt-1 grid gap-1">{MENTORSHIP.map((m) => <li key={m}>{m}</li>)}</ul>
      </Block>
      <Block label={`Session rates in ${plan.rateRange.region}`}>
        PTs typically charge £{plan.rateRange.low}–£{plan.rateRange.high} a session. <span className="text-faint">(PT Launch Lab estimate)</span>
      </Block>
      <p className="text-soft">{plan.paymentLine}</p>
      <div className="mt-2"><FunnelPricingBlock /></div>
      <div className="grid sm:grid-cols-3 gap-3 mt-2">
        {plan.buttons.map((b, i) => (
          <a key={b.href + b.label} href={b.href} onClick={() => trackEvent("career_planner_cta", { href: b.href, position: i, band: plan.band })}
            className={`${i === 0 ? "bg-gold text-deep font-bold" : "border border-white/25 text-white font-semibold"} rounded-full px-4 py-3 text-center text-sm ${FOCUS}`}>
            {b.label}
          </a>
        ))}
      </div>
      <div className="mt-2">
        <ObjectionCapture
          context="career_planner_result"
          heading="Not ready to take the next step? Tell us why."
          sub="One tap, no email needed. It helps us make this easier for people in your situation."
        />
      </div>
    </div>
  );
}
