"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";
import { trackEvent } from "@/app/lib/gtag";

// ─────────────────────────────────────────────────────────────────────────────
// PT Salary Calculator — public lead-magnet anchor for /personal-trainer-salary-uk
//
// Flow:
//   1. User picks employment path, region, experience, hours/week
//   2. Live preliminary headline number renders below the inputs
//   3. Email gate sits between the headline and the detailed breakdown
//   4. After submit → cookie set, full breakdown reveals + £200 FunnelPricingBlock
//
// Rate model is derived from the /personal-trainer-salary-uk pillar:
//   Tier 1 (employed chain)    £18-28k yr1 → £24-32k yr2-3 → £30-42k yr4+
//   Tier 2 (self-employed)     £30-60k    → grows to £40-55k by yr2-3
//   Tier 3 (online)            £0-£250k   wildly variable, modelled conservatively
//   Tier 4 (hybrid multi)      £80k+      at year 4+
// ─────────────────────────────────────────────────────────────────────────────

type Employment = "employed" | "self-employed" | "hybrid" | "online";
type Region = "london" | "north" | "midlands-south" | "scotland-wales-ni";
type Experience = "year1" | "year2-3" | "year4plus";

const employmentLabels: Record<Employment, string> = {
  employed: "Employed at a commercial chain",
  "self-employed": "Self-employed renting gym space",
  hybrid: "Hybrid (in-person + online + group)",
  online: "Online-only coach",
};
const regionLabels: Record<Region, string> = {
  london: "London",
  north: "North England / Yorkshire",
  "midlands-south": "Midlands / South (not London)",
  "scotland-wales-ni": "Scotland / Wales / NI",
};
const experienceLabels: Record<Experience, string> = {
  year1: "Year 1 (just qualified)",
  "year2-3": "Year 2–3 (building book)",
  year4plus: "Year 4+ (established)",
};

// Annual base income (£) at 40hrs/week. Hours below scale linearly; above 40
// scales sub-linearly (diminishing returns reflect realistic burnout).
const BASE_RATES: Record<Employment, Record<Region, Record<Experience, number>>> = {
  employed: {
    london:              { year1: 24000, "year2-3": 32000, year4plus: 42000 },
    north:               { year1: 18000, "year2-3": 24000, year4plus: 30000 },
    "midlands-south":    { year1: 20000, "year2-3": 26000, year4plus: 34000 },
    "scotland-wales-ni": { year1: 19000, "year2-3": 25000, year4plus: 32000 },
  },
  "self-employed": {
    london:              { year1: 32000, "year2-3": 52000, year4plus: 72000 },
    north:               { year1: 26000, "year2-3": 42000, year4plus: 58000 },
    "midlands-south":    { year1: 28000, "year2-3": 46000, year4plus: 62000 },
    "scotland-wales-ni": { year1: 25000, "year2-3": 40000, year4plus: 55000 },
  },
  hybrid: {
    london:              { year1: 36000, "year2-3": 65000, year4plus: 95000 },
    north:               { year1: 30000, "year2-3": 56000, year4plus: 82000 },
    "midlands-south":    { year1: 32000, "year2-3": 60000, year4plus: 88000 },
    "scotland-wales-ni": { year1: 28000, "year2-3": 52000, year4plus: 78000 },
  },
  online: {
    london:              { year1: 12000, "year2-3": 42000, year4plus: 85000 },
    north:               { year1: 10000, "year2-3": 38000, year4plus: 80000 },
    "midlands-south":    { year1: 11000, "year2-3": 40000, year4plus: 82000 },
    "scotland-wales-ni": { year1: 10000, "year2-3": 38000, year4plus: 80000 },
  },
};

function hoursMultiplier(hours: number): number {
  if (hours <= 0) return 0;
  if (hours <= 40) return hours / 40;
  return 1 + (hours - 40) * 0.018; // ~18% gain at 50hrs vs 40
}

function fmt(n: number): string {
  return `£${Math.round(n / 100) * 100}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

type Inputs = {
  employment: Employment;
  region: Region;
  experience: Experience;
  hoursPerWeek: number;
};

function project(inputs: Inputs) {
  const m = hoursMultiplier(inputs.hoursPerWeek);
  const base = BASE_RATES[inputs.employment][inputs.region];
  return {
    year1: Math.round(base.year1 * m),
    "year2-3": Math.round(base["year2-3"] * m),
    year4plus: Math.round(base.year4plus * m),
    current: Math.round(base[inputs.experience] * m),
  };
}

export default function SalaryCalculatorClient() {
  const [inputs, setInputs] = useState<Inputs>({
    employment: "self-employed",
    region: "north",
    experience: "year1",
    hoursPerWeek: 35,
  });
  const [unlocked, setUnlocked] = useState(false);
  const [emailForm, setEmailForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo(() => project(inputs), [inputs]);
  const monthly = Math.round(results.current / 12);
  const weekly = Math.round(results.current / 52);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailForm.name.trim() || !emailForm.email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/salary-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailForm.name.trim(),
          email: emailForm.email.trim().toLowerCase(),
          phone: emailForm.phone.trim(),
          inputs,
          results: {
            year1: results.year1,
            "year2_3": results["year2-3"],
            year4plus: results.year4plus,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      trackEvent("salary_calculator_unlocked", {
        employment: inputs.employment,
        region: inputs.region,
        experience: inputs.experience,
      });
      setUnlocked(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">
            Free Interactive Tool · UK PT Income
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
            Personal trainer salary calculator UK:{" "}
            <span className="text-gold">see your projected income.</span>
          </h1>
          <p className="text-xl text-soft/80 leading-relaxed mb-4">
            Pick your career path, region, and experience tier. We&apos;ll
            estimate your <strong className="text-white">year 1, year 2–3, and year 4+</strong> annual income based on real numbers from PT Launch Lab podcast guests who&apos;ve built six-figure PT businesses.
          </p>
          <p className="text-soft/60 leading-relaxed">
            Built from the data in our{" "}
            <Link href="/personal-trainer-salary-uk" className="text-gold underline hover:no-underline">
              UK Personal Trainer Salary 2026 guide
            </Link>{" "}
            — Mac Livock (PureGym manager, EP8), Ryan Robinson (£500K PT, EP6), and 30+ podcast hours of real industry numbers.
          </p>
        </div>
      </section>

      <section className="bg-base px-6 pb-20">
        <div className="max-w-4xl mx-auto">

          {/* INPUTS */}
          <div className="bg-card rounded-2xl border border-white/[0.07] p-6 md:p-8 mb-6">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
              Step 1
            </p>
            <h2 className="font-display font-extrabold text-2xl text-white mb-6 leading-tight">
              Tell us about your PT path
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-soft/80 mb-2">
                  Your career path
                </label>
                <select
                  value={inputs.employment}
                  onChange={(e) => setInputs((p) => ({ ...p, employment: e.target.value as Employment }))}
                  className="w-full px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white focus:outline-none focus:border-gold transition-colors text-sm"
                >
                  {(Object.keys(employmentLabels) as Employment[]).map((k) => (
                    <option key={k} value={k}>{employmentLabels[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft/80 mb-2">
                  Region
                </label>
                <select
                  value={inputs.region}
                  onChange={(e) => setInputs((p) => ({ ...p, region: e.target.value as Region }))}
                  className="w-full px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white focus:outline-none focus:border-gold transition-colors text-sm"
                >
                  {(Object.keys(regionLabels) as Region[]).map((k) => (
                    <option key={k} value={k}>{regionLabels[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft/80 mb-2">
                  Where you are now
                </label>
                <select
                  value={inputs.experience}
                  onChange={(e) => setInputs((p) => ({ ...p, experience: e.target.value as Experience }))}
                  className="w-full px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white focus:outline-none focus:border-gold transition-colors text-sm"
                >
                  {(Object.keys(experienceLabels) as Experience[]).map((k) => (
                    <option key={k} value={k}>{experienceLabels[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soft/80 mb-2">
                  Hours per week:{" "}
                  <span className="text-gold font-bold">{inputs.hoursPerWeek}h</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={55}
                  step={1}
                  value={inputs.hoursPerWeek}
                  onChange={(e) => setInputs((p) => ({ ...p, hoursPerWeek: Number(e.target.value) }))}
                  className="w-full accent-gold"
                />
                <div className="flex justify-between text-faint text-xs mt-1">
                  <span>15h</span><span>35h</span><span>55h</span>
                </div>
              </div>
            </div>
          </div>

          {/* HEADLINE RESULT (always visible) */}
          <div className="bg-gradient-to-br from-[#0D3559] to-card rounded-2xl border border-gold/30 p-6 md:p-8 mb-6">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
              Your estimate
            </p>
            <h2 className="font-display font-extrabold text-white text-2xl mb-1 leading-tight">
              You&apos;re on track for
            </h2>
            <p className="font-display font-extrabold text-5xl md:text-6xl text-gold mb-2 leading-none tracking-tight tabular-nums">
              {fmt(results.current)}<span className="text-2xl md:text-3xl text-soft/60">/yr</span>
            </p>
            <p className="text-soft/70 text-base">
              Roughly <strong className="text-white">{fmt(monthly)}/mo</strong> · {fmt(weekly)}/wk
            </p>
            <p className="text-faint text-xs mt-3 leading-relaxed">
              Based on {employmentLabels[inputs.employment].toLowerCase()} in {regionLabels[inputs.region]} at {inputs.hoursPerWeek} hours/week, {experienceLabels[inputs.experience].toLowerCase()}.
            </p>
          </div>

          {/* DETAILED PROJECTION — gated until email submit */}
          {!unlocked ? (
            <div className="bg-card rounded-2xl border border-white/[0.07] p-6 md:p-8 mb-6 relative overflow-hidden">
              {/* Faded preview behind the gate */}
              <div className="absolute inset-0 pointer-events-none px-6 md:px-8 py-8 opacity-30 blur-sm select-none">
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">
                  Your 4-year income projection
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[results.year1, results["year2-3"], results.year4plus].map((v, i) => (
                    <div key={i} className="rounded-xl bg-deep p-4 border border-white/[0.06]">
                      <p className="text-soft/60 text-xs mb-1">Year {i + 1}</p>
                      <p className="font-display font-extrabold text-2xl text-white tabular-nums">{fmt(v)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email gate */}
              <div className="relative z-10 bg-card/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gold/30">
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
                  Step 2 · Unlock your full report
                </p>
                <h3 className="font-display font-extrabold text-white text-2xl mb-2 leading-tight">
                  See your year 1 → year 4+ projection.
                </h3>
                <p className="text-soft/70 text-sm mb-6 leading-relaxed">
                  Enter your email to unlock the full breakdown, including how to climb from your current tier to the £80k+ band — plus a <strong className="text-gold">£200 discount on the NCFE Level 3 PT course</strong> for the next 48 hours.
                </p>

                <form onSubmit={handleUnlock} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full name"
                      required
                      autoComplete="name"
                      className="px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-sm"
                    />
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email address"
                      required
                      autoComplete="email"
                      className="px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-sm"
                    />
                  </div>
                  <input
                    type="tel"
                    value={emailForm.phone}
                    onChange={(e) => setEmailForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Mobile (optional)"
                    autoComplete="tel"
                    className="w-full px-4 py-3 rounded-xl bg-deep border border-white/[0.08] text-white placeholder-faint focus:outline-none focus:border-gold transition-colors text-sm"
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-gold/20 disabled:opacity-60"
                  >
                    {submitting ? "Unlocking…" : "Unlock my full report →"}
                  </button>
                  <p className="text-faint text-xs text-center">
                    Free. No spam. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* UNLOCKED — full projection */}
              <div className="bg-card rounded-2xl border border-gold/30 p-6 md:p-8 mb-6">
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
                  Your 4-year income projection
                </p>
                <h3 className="font-display font-extrabold text-white text-2xl mb-5 leading-tight">
                  Where this path takes you.
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <div className={`rounded-xl p-5 border ${inputs.experience === "year1" ? "bg-gold/10 border-gold/40" : "bg-deep border-white/[0.06]"}`}>
                    <p className="text-soft/60 text-xs uppercase tracking-widest mb-1">Year 1</p>
                    <p className="font-display font-extrabold text-3xl text-white tabular-nums">{fmt(results.year1)}</p>
                    <p className="text-faint text-xs mt-1">{fmt(Math.round(results.year1 / 12))}/mo</p>
                  </div>
                  <div className={`rounded-xl p-5 border ${inputs.experience === "year2-3" ? "bg-gold/10 border-gold/40" : "bg-deep border-white/[0.06]"}`}>
                    <p className="text-soft/60 text-xs uppercase tracking-widest mb-1">Year 2–3</p>
                    <p className="font-display font-extrabold text-3xl text-white tabular-nums">{fmt(results["year2-3"])}</p>
                    <p className="text-faint text-xs mt-1">{fmt(Math.round(results["year2-3"] / 12))}/mo</p>
                  </div>
                  <div className={`rounded-xl p-5 border ${inputs.experience === "year4plus" ? "bg-gold/10 border-gold/40" : "bg-deep border-white/[0.06]"}`}>
                    <p className="text-soft/60 text-xs uppercase tracking-widest mb-1">Year 4+</p>
                    <p className="font-display font-extrabold text-3xl text-white tabular-nums">{fmt(results.year4plus)}</p>
                    <p className="text-faint text-xs mt-1">{fmt(Math.round(results.year4plus / 12))}/mo</p>
                  </div>
                </div>

                <div className="rounded-xl bg-deep/50 p-5 border border-white/[0.06]">
                  <p className="text-white font-semibold text-sm mb-2">
                    What this projection assumes
                  </p>
                  <ul className="space-y-1.5 text-soft/70 text-sm">
                    <li>• {employmentLabels[inputs.employment]}</li>
                    <li>• {regionLabels[inputs.region]} — rates from real PT Launch Lab podcast data</li>
                    <li>• {inputs.hoursPerWeek} hours/week (sub-linear scaling above 40h)</li>
                    <li>• Realistic year-on-year client book growth, not best-case</li>
                  </ul>
                </div>
              </div>

              {/* HOW TO CLIMB THE TIERS */}
              <div className="bg-card rounded-2xl border border-white/[0.07] p-6 md:p-8 mb-6">
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
                  How to climb the tiers
                </p>
                <h3 className="font-display font-extrabold text-white text-2xl mb-4 leading-tight">
                  The path from your current number to the top.
                </h3>
                <ol className="space-y-3 text-soft/80 text-sm leading-relaxed">
                  <li>
                    <strong className="text-white">1. Get qualified properly.</strong>{" "}
                    NCFE Level 3 — the one UK gyms actually accept (£29 weekend certs don&apos;t get hired).
                  </li>
                  <li>
                    <strong className="text-white">2. Get into a partner gym.</strong>{" "}
                    Year 1 income is decided by access to clients more than skill. PT Launch Lab guarantees interviews with our partner gym network.
                  </li>
                  <li>
                    <strong className="text-white">3. Build the book to £40k+ by year 2.</strong>{" "}
                    Self-employed in a busy gym at £35–£45/session × 20 sessions/week × 48 weeks = £36k. Possible from month 8 if you can sell.
                  </li>
                  <li>
                    <strong className="text-white">4. Add online + hybrid streams in year 3.</strong>{" "}
                    This is the £80k+ jump — gym floor + online programmes + group sessions. Multi-stream is where the multipliers are.
                  </li>
                </ol>
                <Link
                  href="/personal-trainer-salary-uk"
                  className="inline-flex items-center gap-1 text-gold text-sm font-semibold mt-5 hover:underline"
                >
                  Read the full UK PT salary guide →
                </Link>
              </div>

              {/* PROMO — the whole reason this exists */}
              <FunnelPricingBlock />
            </>
          )}

          {/* SECONDARY CTA always visible */}
          <div className="bg-card rounded-2xl border border-white/[0.07] p-6 md:p-8 text-center mt-6">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">
              Not ready to enrol?
            </p>
            <h3 className="font-display font-extrabold text-white text-xl mb-2 leading-tight">
              Take the 60-second career quiz instead.
            </h3>
            <p className="text-soft/70 text-sm mb-5">
              Find out if PT is actually the right move for your situation — and which path (employed / self-employed / hybrid / online) fits you.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gold text-gold font-bold text-sm hover:bg-gold hover:text-deep transition-all"
            >
              Take the Free Career Quiz →
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}
