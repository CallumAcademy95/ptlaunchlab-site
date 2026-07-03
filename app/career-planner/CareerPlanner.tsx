"use client";

import { useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ObjectionCapture from "../components/ObjectionCapture";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";
import {
  computeCareerPlan,
  REGIONS,
  COURSE_PRICE,
  type CareerPlannerInputs,
  type CareerPlannerResult,
  type GymExperience,
  type CareerJob,
} from "@/app/lib/careerPlanner";

// ── Step config ──────────────────────────────────────────────────────────────
type StepKey = "salary" | "expenses" | "savings" | "job" | "region" | "experience" | "goal" | "mindset";
const STEP_ORDER: StepKey[] = ["salary", "expenses", "savings", "job", "region", "experience", "goal", "mindset"];

const JOBS: { value: CareerJob; label: string }[] = [
  { value: "desk", label: "Office / desk job" },
  { value: "trades", label: "Trades / manual" },
  { value: "retail", label: "Retail / sales" },
  { value: "hospitality", label: "Hospitality" },
  { value: "warehouse", label: "Warehouse / driving" },
  { value: "forces", label: "Forces / ex-forces" },
  { value: "health", label: "Health / care" },
  { value: "other", label: "Something else" },
];

const EXPERIENCE: { value: GymExperience; label: string; sub: string }[] = [
  { value: "none", label: "New to it", sub: "I train a bit, no coaching experience" },
  { value: "regular", label: "Serious gym-goer", sub: "I know my way around training" },
  { value: "trained-others", label: "I've helped others train", sub: "Friends, family, informal coaching" },
  { value: "qualified-lapsed", label: "Previously qualified", sub: "Lapsed L2/L3 or ex-industry" },
];

const DEFAULTS: CareerPlannerInputs = {
  currentSalary: 0, monthlyExpenses: 0, savings: 0,
  job: "desk", region: "", experience: "none",
  targetMonthlyIncome: 0, hoursPerWeek: 0, confidence: 3, risk: 3,
};

const gbp = (n: number) => `£${Math.round(n).toLocaleString()}`;

export default function CareerPlanner() {
  const [phase, setPhase] = useState<"intro" | "steps" | "gate" | "results">("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [inputs, setInputs] = useState<CareerPlannerInputs>(DEFAULTS);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [result, setResult] = useState<CareerPlannerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const sec = useFormSecurity();

  const set = <K extends keyof CareerPlannerInputs>(k: K, v: CareerPlannerInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const stepKey = STEP_ORDER[stepIdx];

  function begin() {
    if (!startedRef.current) { trackEvent("career_planner_start"); startedRef.current = true; }
    setPhase("steps");
  }

  function next() {
    trackEvent("career_planner_step", { step_index: stepIdx, step_key: stepKey });
    if (stepIdx < STEP_ORDER.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setResult(computeCareerPlan(inputs));
      trackEvent("career_planner_result_ready");
      setPhase("gate");
    }
  }
  function back() {
    if (phase === "gate") { setPhase("steps"); return; }
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  // Is the current step answered?
  function stepValid(): boolean {
    switch (stepKey) {
      case "salary": return inputs.currentSalary > 0;
      case "expenses": return inputs.monthlyExpenses > 0;
      case "savings": return inputs.savings >= 0 && String(inputs.savings) !== "";
      case "job": return !!inputs.job;
      case "region": return !!inputs.region;
      case "experience": return !!inputs.experience;
      case "goal": return inputs.targetMonthlyIncome > 0 && inputs.hoursPerWeek > 0;
      case "mindset": return inputs.confidence >= 1 && inputs.risk >= 1;
      default: return true;
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!lead.name.trim() || !lead.email.trim()) { setError("Please enter your name and email."); return; }
    setSubmitting(true);

    const computed = result ?? computeCareerPlan(inputs);
    const eventId =
      (typeof window !== "undefined" && window.crypto?.randomUUID?.()) ||
      `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Browser Pixel Lead — deduped server-side via the same eventID.
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: "career_planner", currency: "GBP", value: 0 }, { eventID: eventId });
    }

    try {
      const res = await fetch("/api/career-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim().toLowerCase(),
          phone: lead.phone.trim(),
          event_id: eventId,
          inputs,
          result: computed,
          [sec.SEC_KEY]: sec.payload(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      trackEvent("career_planner_complete", {
        readiness_score: computed.readinessScore,
        business_model: computed.businessModel,
        quit_months: computed.quitMonths,
      });
      setResult(computed);
      setPhase("results");
    } catch {
      setError("Network error. Please try again.");
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
              <Progress current={stepIdx + 1} total={STEP_ORDER.length} />
              <StepCard
                stepKey={stepKey}
                inputs={inputs}
                set={set}
              />
              <NavButtons
                onBack={stepIdx > 0 ? back : undefined}
                onNext={next}
                nextDisabled={!stepValid()}
                nextLabel={stepIdx === STEP_ORDER.length - 1 ? "See my plan →" : "Continue →"}
              />
            </div>
          )}

          {phase === "gate" && result && (
            <Gate
              lead={lead}
              setLead={setLead}
              onBack={back}
              onSubmit={submitLead}
              submitting={submitting}
              error={error}
              teaserScore={result.readinessScore}
              teaserQuit={result.quitLabel}
            />
          )}

          {phase === "results" && result && <Results r={result} name={lead.name.split(" ")[0]} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Intro ────────────────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">Free · 60 seconds · No obligation</p>
      <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-none tracking-tight mb-4">
        Your PT <span className="text-gold">Career Escape Plan</span>
      </h1>
      <p className="text-soft text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
        Answer 8 quick questions and get a realistic picture: when you could go full-time, what you
        could earn, and the exact route to get there. Built by gym owners who&apos;ve hired 500+ trainers.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-9 text-left">
        {[
          ["Quit date", "When you could go full-time"],
          ["Year-1 income", "What you could realistically earn"],
          ["Readiness score", "How ready you are today"],
          ["Your route", "Qualification, payment & model"],
        ].map(([t, s]) => (
          <div key={t} className="bg-deep border border-white/10 rounded-xl p-3">
            <p className="text-gold text-xs font-bold uppercase tracking-wide mb-1">{t}</p>
            <p className="text-faint text-[11px] leading-snug">{s}</p>
          </div>
        ))}
      </div>
      <button onClick={onStart}
        className="w-full sm:w-auto px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all">
        Build my plan →
      </button>
    </div>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────────
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

// ── Step card ────────────────────────────────────────────────────────────────
function StepCard({
  stepKey, inputs, set,
}: {
  stepKey: StepKey;
  inputs: CareerPlannerInputs;
  set: <K extends keyof CareerPlannerInputs>(k: K, v: CareerPlannerInputs[K]) => void;
}) {
  const heading: Record<StepKey, [string, string]> = {
    salary: ["What do you earn now?", "Your current gross salary (before tax)."],
    expenses: ["What are your monthly outgoings?", "Rent/mortgage, bills, food — what you need to cover each month."],
    savings: ["How much have you got saved?", "A rough buffer figure. It's fine if it's £0."],
    job: ["What's your current job?", "So we can frame the move realistically."],
    region: ["Where are you based?", "PT rates vary across the UK."],
    experience: ["How much coaching experience have you got?", "Be honest — it changes your route, not your welcome."],
    goal: ["What are you aiming for?", "Your target take-home from PT and the time you can give it."],
    mindset: ["Where's your head at?", "Two quick sliders — no wrong answers."],
  };
  const [title, sub] = heading[stepKey];

  return (
    <div className="bg-base border border-white/10 rounded-2xl p-6 md:p-8 mb-6">
      <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-1.5">{title}</h2>
      <p className="text-soft text-sm mb-6">{sub}</p>

      {stepKey === "salary" && (
        <MoneyInput value={inputs.currentSalary} onChange={(v) => set("currentSalary", v)} suffix="/ year" placeholder="28,000" />
      )}
      {stepKey === "expenses" && (
        <MoneyInput value={inputs.monthlyExpenses} onChange={(v) => set("monthlyExpenses", v)} suffix="/ month" placeholder="1,800" />
      )}
      {stepKey === "savings" && (
        <MoneyInput value={inputs.savings} onChange={(v) => set("savings", v)} placeholder="2,000" allowZero />
      )}
      {stepKey === "job" && (
        <OptionGrid
          options={JOBS}
          value={inputs.job}
          onSelect={(v) => set("job", v)}
        />
      )}
      {stepKey === "region" && (
        <OptionGrid
          options={REGIONS.map((r) => ({ value: r, label: r }))}
          value={inputs.region}
          onSelect={(v) => set("region", v)}
        />
      )}
      {stepKey === "experience" && (
        <div className="grid gap-2.5">
          {EXPERIENCE.map((o) => (
            <button key={o.value} type="button" onClick={() => set("experience", o.value)}
              className={`text-left rounded-xl p-4 border transition-all ${
                inputs.experience === o.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-gold/40"
              }`}>
              <p className="text-white font-bold text-sm">{o.label}</p>
              <p className="text-faint text-xs mt-0.5">{o.sub}</p>
            </button>
          ))}
        </div>
      )}
      {stepKey === "goal" && (
        <div className="space-y-6">
          <div>
            <label className="text-soft text-xs font-semibold uppercase tracking-wide mb-2 block">Target take-home from PT</label>
            <MoneyInput value={inputs.targetMonthlyIncome} onChange={(v) => set("targetMonthlyIncome", v)} suffix="/ month" placeholder="3,000" />
          </div>
          <div>
            <label className="text-soft text-xs font-semibold uppercase tracking-wide mb-2 block">Hours a week you can give it: <span className="text-gold">{inputs.hoursPerWeek || 0}h</span></label>
            <input type="range" min={0} max={40} step={1} value={inputs.hoursPerWeek}
              onChange={(e) => set("hoursPerWeek", Number(e.target.value))}
              className="w-full accent-[#F5C518]" />
            <div className="flex justify-between text-faint text-[11px] mt-1"><span>0h</span><span>40h</span></div>
          </div>
        </div>
      )}
      {stepKey === "mindset" && (
        <div className="space-y-7">
          <Scale label="How confident are you about making the switch?" lowLabel="Nervous" highLabel="Certain"
            value={inputs.confidence} onChange={(v) => set("confidence", v)} />
          <Scale label="How comfortable are you taking a risk on yourself?" lowLabel="Cautious" highLabel="All in"
            value={inputs.risk} onChange={(v) => set("risk", v)} />
        </div>
      )}
    </div>
  );
}

function MoneyInput({
  value, onChange, suffix, placeholder, allowZero,
}: { value: number; onChange: (n: number) => void; suffix?: string; placeholder?: string; allowZero?: boolean }) {
  return (
    <div className="flex items-center bg-deep border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-gold/50 transition-colors">
      <span className="text-gold font-bold text-xl mr-2">£</span>
      <input
        type="text" inputMode="numeric" autoFocus
        value={value ? value.toLocaleString() : (allowZero && value === 0 ? "" : "")}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d]/g, ""));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-white/20"
      />
      {suffix && <span className="text-faint text-sm ml-2 whitespace-nowrap">{suffix}</span>}
    </div>
  );
}

function OptionGrid<T extends string>({
  options, value, onSelect,
}: { options: { value: T; label: string }[]; value: T; onSelect: (v: T) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onSelect(o.value)}
          className={`text-left rounded-xl px-4 py-3.5 border text-sm font-semibold transition-all ${
            value === o.value ? "border-gold bg-gold/10 text-white" : "border-white/10 text-soft hover:border-gold/40"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Scale({
  label, lowLabel, highLabel, value, onChange,
}: { label: string; lowLabel: string; highLabel: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-white font-semibold text-sm mb-3">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`py-3 rounded-xl border font-bold transition-all ${
              value === n ? "border-gold bg-gold text-deep" : "border-white/10 text-soft hover:border-gold/40"
            }`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-faint text-[11px] mt-1.5"><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

function NavButtons({
  onBack, onNext, nextDisabled, nextLabel,
}: { onBack?: () => void; onNext: () => void; nextDisabled: boolean; nextLabel: string }) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <button onClick={onBack} className="px-6 py-3.5 rounded-full border border-white/15 text-soft font-semibold text-sm hover:border-white/30 transition-all">
          ← Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled}
        className="flex-1 px-6 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {nextLabel}
      </button>
    </div>
  );
}

// ── Email gate ───────────────────────────────────────────────────────────────
function Gate({
  lead, setLead, onBack, onSubmit, submitting, error, teaserScore, teaserQuit,
}: {
  lead: { name: string; email: string; phone: string };
  setLead: (l: { name: string; email: string; phone: string }) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  teaserScore: number;
  teaserQuit: string;
}) {
  return (
    <div>
      <div className="text-center mb-7">
        <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">Your plan is ready</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight mb-3">
          Where should we send it?
        </h2>
        <p className="text-soft text-sm max-w-md mx-auto">
          Your readiness score is <span className="text-gold font-bold">{teaserScore}/100</span> and {teaserQuit.toLowerCase()}.
          Enter your details to unlock the full breakdown.
        </p>
      </div>
      <form onSubmit={onSubmit} className="bg-base border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
        <input type="text" required placeholder="Full name"
          value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })}
          className="w-full bg-deep border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-colors placeholder-white/25" />
        <input type="email" required placeholder="Email address"
          value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })}
          className="w-full bg-deep border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-colors placeholder-white/25" />
        <input type="tel" placeholder="Phone (optional)"
          value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })}
          className="w-full bg-deep border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-colors placeholder-white/25" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-60">
          {submitting ? "Building your plan…" : "Show my Career Escape Plan →"}
        </button>
        <div className="flex justify-between items-center pt-1">
          <button type="button" onClick={onBack} className="text-faint text-xs hover:text-soft transition-colors">← Back</button>
          <p className="text-faint text-[11px]">No spam. Unsubscribe anytime.</p>
        </div>
      </form>
    </div>
  );
}

// ── Results ──────────────────────────────────────────────────────────────────
function Results({ r, name }: { r: CareerPlannerResult; name: string }) {
  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">{name ? `${name}'s` : "Your"} Career Escape Plan</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight">
          {r.quitLabel}.
        </h2>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard big={`${r.readinessScore}`} unit="/100" label="Readiness score" note={r.readinessBand} />
        <StatCard big={gbp(r.year1Income)} label="Year-1 income" note={`potential ${gbp(r.steadyIncome)} by yr 2–3`} />
        <StatCard big={`~${r.quitMonths}`} unit="mo" label="To full-time" note="building part-time first" />
      </div>

      <Insight title="What to focus on" body={r.readinessMessage} />
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <Card label="Your income potential" value={`${gbp(r.year1Income)} year one`} note={r.incomeNote} />
        <Card label="Recommended route" value={r.recommendedRoute} note={r.routeNote} />
        <Card label="Best business model" value={r.businessModel} note={r.businessNote} />
        <Card label="How to pay for it" value={r.financeOption} note={r.financeNote} />
      </div>
      <Insight title="Your course pays for itself fast" body={r.paybackNote} />

      <FinanceModule r={r} />

      {/* CTAs */}
      <div className="bg-base border border-gold/30 rounded-2xl p-6 md:p-8 text-center mt-8">
        <p className="text-gold text-xs font-bold tracking-widest uppercase mb-2">Your next step</p>
        <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight mb-3">
          Turn this plan into reality.
        </h3>
        <p className="text-soft text-sm mb-6 max-w-md mx-auto">
          The {r.recommendedRoute} is how you get there — Ofqual-regulated, with the mentorship that
          actually teaches you to get clients. You&apos;ve unlocked <span className="text-gold font-bold">£200 off for 48 hours</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/enrol" className="px-8 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">
            See the course & enrol →
          </a>
          <a href="/book-call" className="px-8 py-3.5 rounded-full border border-gold text-gold font-bold text-sm hover:bg-gold/10 transition-all">
            Talk it through on a call
          </a>
        </div>
      </div>

      <div className="mt-6">
        <ObjectionCapture
          context="career_planner_result"
          heading="Not ready to take the next step? Tell us why."
          sub="One tap — no email needed. It helps us make this easier for people in your situation."
        />
      </div>

      <p className="text-faint text-[11px] text-center mt-6 leading-relaxed max-w-lg mx-auto">
        These figures are illustrative estimates based on your answers and typical UK PT rates — a guide to
        help you plan, not a guarantee of earnings.
      </p>
    </div>
  );
}

// ── Finance / ROI module ─────────────────────────────────────────────────────
function FinanceModule({ r }: { r: CareerPlannerResult }) {
  const f = r.finance;
  return (
    <div className="bg-base border border-white/10 rounded-2xl p-6 md:p-8 mt-8">
      <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-1">The numbers on the investment</p>
      <h3 className="font-display font-extrabold text-2xl text-white leading-tight tracking-tight mb-5">
        £{COURSE_PRICE.toLocaleString()} in. Here&apos;s what it returns.
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard big={`${f.roiYear1}×`} label="Year-1 return" note="projected income vs course fee" />
        <StatCard
          big={f.breakEvenWeeks ? `~${f.breakEvenWeeks}` : "—"}
          unit={f.breakEvenWeeks ? "wk" : undefined}
          label="Break-even"
          note="weeks of clients to recoup the fee"
        />
        <StatCard big={gbp(f.threeYearGross)} label="3-year gross" note="cumulative, years 1–3" />
      </div>

      {/* Finance plan comparison */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {f.plans.map((p) => (
          <div key={p.name} className="bg-deep border border-white/10 rounded-xl p-5">
            <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-1.5">{p.name}</p>
            <p className="text-white font-bold text-lg leading-tight">
              {p.monthly > 0
                ? <>{gbp(p.upfront)} <span className="text-soft text-sm font-semibold">+ {p.months} × {gbp(p.monthly)}</span></>
                : <>{gbp(p.upfront)} <span className="text-soft text-sm font-semibold">one-off</span></>}
            </p>
            <p className="text-faint text-xs leading-snug mt-1.5">{p.note}</p>
          </div>
        ))}
      </div>

      <Insight title="Can you afford the payments?" body={f.planNote} />
    </div>
  );
}

function StatCard({ big, unit, label, note }: { big: string; unit?: string; label: string; note?: string }) {
  return (
    <div className="bg-base border border-white/10 rounded-2xl p-5 text-center">
      <p className="font-display font-extrabold text-4xl text-gold leading-none">
        {big}{unit && <span className="text-2xl text-gold/70">{unit}</span>}
      </p>
      <p className="text-white text-xs font-bold uppercase tracking-wide mt-2">{label}</p>
      {note && <p className="text-faint text-[11px] mt-1">{note}</p>}
    </div>
  );
}

function Card({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-base border border-white/10 rounded-2xl p-5">
      <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-white font-bold text-base leading-tight mb-1.5">{value}</p>
      <p className="text-faint text-xs leading-snug">{note}</p>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-deep border-l-2 border-gold rounded-r-xl px-5 py-4 mb-3">
      <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-soft text-sm leading-relaxed">{body}</p>
    </div>
  );
}
