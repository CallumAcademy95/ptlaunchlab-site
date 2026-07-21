"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/app/lib/gtag";
import { generateEnrolmentPDFBase64 } from "@/app/lib/generateEnrolmentPDF";
import { useFormSecurity } from "@/app/lib/security/client";
import {
  type LearnerDetails,
  type LearningDetails,
  type AgreementState,
  type EnrolmentContext,
  ENROLMENT_CONTEXT_KEY,
  blankLearner,
  blankLearning,
  blankAgreement,
  input,
  sel,
  Field,
  Card,
  Check,
} from "../shared";

const TERMS_URL = "/terms";

// "postpay" — the default pay-first flow: buyer lands here after Stripe.
// "manual"  — no-payment learner-detail capture (e.g. sending an already-paid
//             learner a link to gather their NCFE record). Drops all payment
//             framing and skips revenue/conversion analytics.
type EnrolMode = "postpay" | "manual";

type Step = 1 | 2 | 3;
const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Learning Info" },
  { num: 3, label: "Agreement" },
];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="w-full mb-12">
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-gold transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} className="relative flex flex-col items-center z-10 flex-1 first:items-start last:items-end">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done    ? "bg-gold text-deep" :
                active  ? "bg-gold text-deep ring-4 ring-gold/25" :
                          "bg-deep border-2 border-white/10 text-faint"
              }`}>
                {done ? (
                  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : s.num}
              </div>
              <span className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${
                active ? "text-gold" : done ? "text-gold/60" : "text-faint"
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Success view — shown once the enrolment form is submitted ───────────────
function CompletedView({ firstName, mode = "postpay" }: { firstName: string; mode?: EnrolMode }) {
  const manual = mode === "manual";
  return (
    <>
      <section className="pt-[128px] pb-16 md:pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-gold">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4">{manual ? "Details received" : "Enrolment complete"}</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-[0.95] tracking-tight mb-6">
            You&apos;re in{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="text-lg md:text-xl text-soft/85 mb-10 leading-relaxed">
            {manual
              ? "Thanks — your enrolment details are saved and on file. Your tutor will be in touch to walk you through the next steps."
              : "Your payment is confirmed and your enrolment paperwork is signed and on file. We’re getting your account set up — keep an eye on your inbox over the next 24 hours."}
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-24 px-6">
        <div className="max-w-3xl mx-auto bg-card border border-white/10 rounded-2xl p-6 md:p-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-8 text-center">
            What happens next
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">1</span>
              <div>
                <p className="text-white font-semibold mb-1">Welcome email (within minutes)</p>
                <p className="text-soft text-sm leading-relaxed">
                  {manual ? "Confirmation" : "Confirmation, receipt,"} and your signed enrolment paperwork — all in
                  one email from <strong className="text-white/80">info@ptlaunchlab.co.uk</strong>.
                  Check spam if you don&apos;t see it.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">2</span>
              <div>
                <p className="text-white font-semibold mb-1">Tutor assigned (within 24 hours)</p>
                <p className="text-soft text-sm leading-relaxed">
                  Your personal NCFE tutor reaches out to introduce themselves
                  and walk you through your learning plan.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">3</span>
              <div>
                <p className="text-white font-semibold mb-1">Mentorship community access</p>
                <p className="text-soft text-sm leading-relaxed">
                  Invite link to the private mentorship community — that&apos;s
                  where you get business support, weekly Q&amp;A and access to
                  Callum, Miles and Ryan.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center">4</span>
              <div>
                <p className="text-white font-semibold mb-1">First module unlocked</p>
                <p className="text-soft text-sm leading-relaxed">
                  Once your tutor is assigned, your first NCFE module is
                  unlocked and you can start whenever you&apos;re ready.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-soft text-sm mb-4">Need anything before you hear from us?</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://wa.me/447822012186" className="px-6 py-3 rounded-full bg-card border border-white/10 text-white text-sm hover:border-gold/40 transition-colors">WhatsApp us</a>
            <a href="mailto:info@ptlaunchlab.co.uk" className="px-6 py-3 rounded-full bg-card border border-white/10 text-white text-sm hover:border-gold/40 transition-colors">info@ptlaunchlab.co.uk</a>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PostPaymentEnrolment({ mode = "postpay" }: { mode?: EnrolMode }) {
  const manual = mode === "manual";
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";

  const [ctx, setCtx]   = useState<EnrolmentContext | null>(null);
  const [done, setDone] = useState(false);

  const [step, setStep]         = useState<Step>(1);
  const [learner, setL]         = useState<LearnerDetails>(blankLearner);
  const [learning, setLn]       = useState<LearningDetails>(blankLearning);
  const [agreement, setA]       = useState<AgreementState>(blankAgreement);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [signMode, setSignMode] = useState<"drawn" | "typed">("drawn");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [typedSig, setTypedSig] = useState("");
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const isDrawing               = useRef(false);
  const lastPos                 = useRef<{ x: number; y: number } | null>(null);
  const sec                     = useFormSecurity();

  // Hydrate from the context stashed at the pay step. Prefills name/email and
  // pre-selects the gym referral when the buyer came via a partner page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ENROLMENT_CONTEXT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as EnrolmentContext;
      setCtx(parsed);
      setL(l => ({ ...l, fullName: parsed.fullName || "", email: parsed.email || "" }));
      if (parsed.gymReferral) {
        setLn(ln => ({ ...ln, heardAbout: `${parsed.gymReferral} (Gym Referral)` }));
      }
    } catch { /* no context — form still works, just unprefilled */ }
  }, []);

  // ─── Canvas signature ─────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || signMode !== "drawn") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    ctx2.strokeStyle = "#F5C518";
    ctx2.lineWidth = 2.5;
    ctx2.lineCap = "round";
    ctx2.lineJoin = "round";

    function pos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: x - r.left, y: y - r.top };
    }
    function down(e: MouseEvent | TouchEvent) {
      e.preventDefault(); isDrawing.current = true; lastPos.current = pos(e);
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!isDrawing.current || !ctx2) return;
      e.preventDefault();
      const p = pos(e);
      if (lastPos.current) {
        ctx2.beginPath();
        ctx2.moveTo(lastPos.current.x, lastPos.current.y);
        ctx2.lineTo(p.x, p.y);
        ctx2.stroke();
      }
      lastPos.current = p;
    }
    function up() { isDrawing.current = false; lastPos.current = null; }

    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("mouseleave", up);
    canvas.addEventListener("touchstart", down, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", up);
    return () => {
      canvas.removeEventListener("mousedown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", up);
      canvas.removeEventListener("mouseleave", up);
      canvas.removeEventListener("touchstart", down);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", up);
    };
  }, [step, signMode]);

  function clearCanvas() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }
  function sigIsEmpty() {
    if (signMode === "typed") return typedSig.trim().length < 2;
    const c = canvasRef.current;
    if (!c) return true;
    return !c.getContext("2d")?.getImageData(0, 0, c.width, c.height).data.some(v => v !== 0);
  }
  function getSig(): string {
    if (signMode === "typed") return typedSig.trim();
    return canvasRef.current?.toDataURL("image/png") ?? "";
  }

  // ─── Validation ───────────────────────────────────────────────────────
  function v1() {
    const e: Record<string, string> = {};
    if (!learner.title)                         e.title = "Required";
    if (!learner.fullName.trim())               e.fullName = "Full legal name is required";
    if (!learner.dateOfBirth)                   e.dateOfBirth = "Date of birth is required";
    if (!learner.gender)                        e.gender = "Required";
    if (!learner.nationalInsurance.trim())      e.nationalInsurance = "National Insurance number is required";
    else if (!/^[A-Z]{2}\d{6}[A-Z]$/i.test(learner.nationalInsurance.replace(/\s/g, "")))
                                                e.nationalInsurance = "Invalid format — expected e.g. AB 12 34 56 C";
    if (!learner.mobile.trim())                 e.mobile = "Mobile number is required";
    if (!learner.email.trim())                  e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(learner.email))
                                                e.email = "Enter a valid email address";
    if (!learner.addressLine1.trim())           e.addressLine1 = "Address line 1 is required";
    if (!learner.town.trim())                   e.town = "Town / city is required";
    if (!learner.postcode.trim())               e.postcode = "Postcode is required";
    return e;
  }
  function v2() {
    const e: Record<string, string> = {};
    if (!learning.heardAbout)           e.heardAbout = "Required";
    if (!learning.highestQualification) e.highestQualification = "Required";
    if (!learning.employmentStatus)     e.employmentStatus = "Required";
    return e;
  }
  function v3() {
    const e: Record<string, string> = {};
    if (!agreement.detailsAccurate)       e.detailsAccurate = "Required";
    if (!agreement.selfFunded)            e.selfFunded = "Required";
    if (!agreement.coolingOffUnderstood)  e.coolingOffUnderstood = "Required";
    if (!agreement.termsAgreed)           e.termsAgreed = "Required";
    if (!agreement.commitToLearning)      e.commitToLearning = "Required";
    if (sigIsEmpty())                     e.signature = "A signature is required before you can continue";
    return e;
  }

  // ─── Navigation ───────────────────────────────────────────────────────
  function next() {
    if (step === 3) { submit(); return; }
    const errs = step === 1 ? v1() : v2();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    trackEvent('enrolment_step_completed', { step_number: step, step_label: STEPS[step - 1]?.label ?? `step_${step}` });
    setStep(s => (s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setStep(s => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── Submit ───────────────────────────────────────────────────────────
  async function submit() {
    if (submitting) return;
    const errs = v3();
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    setSubmitError("");
    setSubmitting(true);

    const record = {
      learnerDetails: learner,
      learningDetails: learning,
      agreement: {
        checkboxes: {
          detailsAccurate: agreement.detailsAccurate,
          selfFunded: agreement.selfFunded,
          coolingOffUnderstood: agreement.coolingOffUnderstood,
          termsAgreed: agreement.termsAgreed,
          commitToLearning: agreement.commitToLearning,
        },
        signature: getSig(),
        signatureType: signMode,
        signedAt: new Date().toISOString(),
      },
      paymentChoice: (manual ? "manual" : (ctx?.plan ?? "full")) as "full" | "deposit" | "manual",
      submittedAt: new Date().toISOString(),
      source: manual ? "admin-manual-ncfe-capture" : "website-enrolment-flow-v2-postpay",
      amountPaid: manual ? 0 : (ctx?.amount ?? (ctx?.plan === "deposit" ? 599 : 1599)),
      stripeSessionId: sessionId || undefined,
      ...(ctx?.gymReferral     && { gymReferral: ctx.gymReferral }),
      ...(ctx?.promoCode       && { promoCode: ctx.promoCode, discountApplied: ctx.discountApplied }),
    };

    // Trigger client-side PDF download for the learner's own records
    try {
      const pdf = await generateEnrolmentPDFBase64(record);
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdf.base64}`;
      link.download = pdf.filename;
      link.click();
    } catch (_) {
      console.warn("Client PDF download failed — continuing.");
    }

    // Send to server — generates the authoritative PDF + emails + sheet row
    try {
      const res = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, [sec.SEC_KEY]: sec.payload() }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch (err) {
      console.error("Enrolment submission failed:", err);
      setSubmitError("Something went wrong saving your enrolment. Your payment is safe — please try again, or email info@ptlaunchlab.co.uk and we'll finish it for you.");
      setSubmitting(false);
      return;
    }

    // Manual admin captures are not a website conversion — don't inflate the
    // enrolment_complete / revenue analytics with a form that took no payment.
    if (!manual) {
      trackEvent('enrolment_complete', {
        payment_type: record.paymentChoice,
        amount: record.amountPaid,
        currency: 'GBP',
        ...(ctx?.promoCode && { promo_code: ctx.promoCode }),
        ...(ctx?.gymReferral && { gym_referral: ctx.gymReferral }),
      });
    }

    try { localStorage.removeItem(ENROLMENT_CONTEXT_KEY); } catch (_) {}
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const firstName = (learner.fullName || ctx?.fullName || "").trim().split(" ")[0];

  if (done) return <CompletedView firstName={firstName} mode={mode} />;

  // ─── Form ─────────────────────────────────────────────────────────────
  return (
    <main className="pt-[112px] pb-16 px-5">
      <div className="max-w-2xl mx-auto">
        <sec.Honeypot />

        {/* Intro banner */}
        <div className="bg-gold/10 border border-gold/30 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3">
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <p className="text-gold font-bold text-sm">{manual ? "Complete your enrolment details." : "Payment received — you’re almost done."}</p>
            <p className="text-soft text-xs mt-0.5">{manual ? "Fill in your learner record below so we can register you with NCFE." : "One last step: complete your enrolment paperwork below to confirm your place."}</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-3">
            {step === 1 && "Your Details"}
            {step === 2 && "Learning Information"}
            {step === 3 && "Agree & Sign"}
          </h1>
          <p className="text-soft text-sm">
            {step === 1 && "Step 1 of 3 — Personal details for your learner record."}
            {step === 2 && "Step 2 of 3 — A few background questions for your learner record."}
            {step === 3 && "Step 3 of 3 — Review your learner agreement and add your signature."}
          </p>
        </div>

        <ProgressBar step={step} />

        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
            <p className="text-red-400 text-sm font-bold mb-2">Please correct the following before continuing:</p>
            <ul className="text-red-400 text-xs space-y-1">
              {Object.values(errors).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        )}

        {/* STEP 1 — Learner Details */}
        {step === 1 && (
          <div className="space-y-6">
            <Card title="Personal Information">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Title" required error={errors.title}>
                  <select value={learner.title} onChange={e => setL({ ...learner, title: e.target.value })} className={sel}>
                    <option value="">—</option>
                    {["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Full Legal Name" required error={errors.fullName} hint="As it appears on official ID or documents">
                    <input type="text" value={learner.fullName}
                      onChange={e => setL({ ...learner, fullName: e.target.value })}
                      placeholder="e.g. Jane Emily Smith" className={input} />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth" required error={errors.dateOfBirth}>
                  <input type="date" value={learner.dateOfBirth}
                    onChange={e => setL({ ...learner, dateOfBirth: e.target.value })} className={input} />
                </Field>
                <Field label="Gender" required error={errors.gender}>
                  <select value={learner.gender} onChange={e => setL({ ...learner, gender: e.target.value })} className={sel}>
                    <option value="">Select</option>
                    {["Male", "Female", "Non-binary", "Prefer not to say", "Prefer to self-describe"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="National Insurance Number" required error={errors.nationalInsurance}
                hint="Required for NCFE qualification registration — e.g. AB 12 34 56 C">
                <input type="text" value={learner.nationalInsurance}
                  onChange={e => setL({ ...learner, nationalInsurance: e.target.value.toUpperCase() })}
                  placeholder="AB 12 34 56 C" className={input} maxLength={13} />
              </Field>
            </Card>

            <Card title="Contact Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Mobile Number" required error={errors.mobile}>
                  <input type="tel" value={learner.mobile}
                    onChange={e => setL({ ...learner, mobile: e.target.value })}
                    placeholder="07700 000000" className={input} />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <input type="email" value={learner.email}
                    onChange={e => setL({ ...learner, email: e.target.value })}
                    placeholder="your@email.com" className={input} />
                </Field>
              </div>
            </Card>

            <Card title="Home Address">
              <Field label="Address Line 1" required error={errors.addressLine1}>
                <input type="text" value={learner.addressLine1}
                  onChange={e => setL({ ...learner, addressLine1: e.target.value })}
                  placeholder="House number and street name" className={input} />
              </Field>
              <Field label="Address Line 2">
                <input type="text" value={learner.addressLine2}
                  onChange={e => setL({ ...learner, addressLine2: e.target.value })}
                  placeholder="Apartment, flat, unit (optional)" className={input} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Town / City" required error={errors.town}>
                  <input type="text" value={learner.town}
                    onChange={e => setL({ ...learner, town: e.target.value })}
                    placeholder="Town or city" className={input} />
                </Field>
                <Field label="County">
                  <input type="text" value={learner.county}
                    onChange={e => setL({ ...learner, county: e.target.value })}
                    placeholder="County (optional)" className={input} />
                </Field>
              </div>
              <Field label="Postcode" required error={errors.postcode}>
                <input type="text" value={learner.postcode}
                  onChange={e => setL({ ...learner, postcode: e.target.value.toUpperCase() })}
                  placeholder="WF8 4AH" className={input + " max-w-[160px]"} maxLength={8} />
              </Field>
            </Card>
          </div>
        )}

        {/* STEP 2 — Learning Information */}
        {step === 2 && (
          <div className="space-y-6">
            {ctx?.gymReferral ? (
              <div className="bg-deep border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                <span className="text-gold text-sm">✓</span>
                <p className="text-soft text-sm">Referred by <span className="text-white font-semibold">{ctx.gymReferral}</span></p>
              </div>
            ) : (
            <Card title="How You Found Us">
              <Field label="How did you hear about PT Launch Lab?" required error={errors.heardAbout}>
                <select value={learning.heardAbout} onChange={e => setLn({ ...learning, heardAbout: e.target.value })} className={sel}>
                  <option value="">Select an option</option>
                  {["Instagram", "Facebook", "TikTok", "YouTube", "Google / Online Search", "Friend or Family", "Gym Referral", "Podcast", "Word of Mouth", "Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </Card>
            )}

            <Card title="Qualifications">
              <Field label="Highest qualification achieved" required error={errors.highestQualification}>
                <select value={learning.highestQualification} onChange={e => setLn({ ...learning, highestQualification: e.target.value })} className={sel}>
                  <option value="">Select</option>
                  {["No formal qualifications", "GCSE / O-Level", "A-Level / AS-Level", "BTEC / NVQ / Level 3", "HNC / HND", "Degree (BA / BSc)", "Postgraduate (Masters / PhD)", "Other professional qualification"].map(q => <option key={q}>{q}</option>)}
                </select>
              </Field>

              <p className="text-soft text-xs">GCSE grades — leave blank if not applicable</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: "gcseEnglish", label: "English" },
                  { key: "gcseMaths",   label: "Maths" },
                  { key: "gcseICT",     label: "ICT / Digital" },
                ] as const).map(({ key, label }) => (
                  <Field key={key} label={`GCSE ${label}`}>
                    <select value={learning[key]} onChange={e => setLn({ ...learning, [key]: e.target.value })} className={sel}>
                      <option value="">N/A</option>
                      {["9","8","7","6","5","4","3","2","1","U","A*","A","B","C","D","E","F","G"].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            </Card>

            <Card title="Employment Status">
              <Field label="Current employment status" required error={errors.employmentStatus}>
                <select value={learning.employmentStatus} onChange={e => setLn({ ...learning, employmentStatus: e.target.value })} className={sel}>
                  <option value="">Select</option>
                  {["Employed full-time", "Employed part-time", "Self-employed", "Unemployed / seeking work", "Student", "Career break", "Retired", "Other"].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </Card>
          </div>
        )}

        {/* STEP 3 — Agreement & Signature */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-deep border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-bold text-xl mb-2">Learner Agreement</h2>
              <p className="text-soft text-sm leading-relaxed mb-6">
                Please read the following carefully. This confirms your commitment and your understanding of key terms.
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-deep border border-white/10 rounded-xl p-5">
                  <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">Full Payment — Refund Terms</p>
                  <ul className="text-soft text-sm space-y-2 leading-relaxed">
                    <li>• You are eligible for a full refund if you cancel within 14 days of payment (the cooling off period).</li>
                    <li>• After the 14-day cooling off period, refunds are not normally available for a change of mind.</li>
                    <li>• Your statutory rights under applicable UK law are not affected by this agreement.</li>
                  </ul>
                </div>
                <div className="bg-deep border border-white/10 rounded-xl p-5">
                  <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-3">Deposit &amp; Monthly Payments — Refund Terms</p>
                  <ul className="text-soft text-sm space-y-2 leading-relaxed">
                    <li>• You are eligible for a full refund of your deposit if you cancel within 14 days of payment (the cooling off period).</li>
                    <li>• After the 14-day cooling off period, your deposit is not normally refundable for a change of mind.</li>
                    <li>• Your statutory rights under applicable UK law are not affected by this agreement.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Check checked={agreement.detailsAccurate} onChange={v => setA({ ...agreement, detailsAccurate: v })} error={!!errors.detailsAccurate}>
                  I confirm that all information I have provided during this enrolment is true and accurate to the best of my knowledge.
                </Check>
                <Check checked={agreement.selfFunded} onChange={v => setA({ ...agreement, selfFunded: v })} error={!!errors.selfFunded}>
                  I understand that this is a self-funded course and I am responsible for the agreed course fees.
                </Check>
                <Check checked={agreement.coolingOffUnderstood} onChange={v => setA({ ...agreement, coolingOffUnderstood: v })} error={!!errors.coolingOffUnderstood}>
                  I have read and understood the cooling off and refund terms set out above, and I acknowledge that different payment methods have different refund conditions.
                </Check>
                <Check checked={agreement.commitToLearning} onChange={v => setA({ ...agreement, commitToLearning: v })} error={!!errors.commitToLearning}>
                  I commit to engaging with the learning process, completing the required coursework, and participating fully in the course.
                </Check>
                <Check checked={agreement.termsAgreed} onChange={v => setA({ ...agreement, termsAgreed: v })} error={!!errors.termsAgreed}>
                  I have read and agree to the{" "}
                  <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline" onClick={e => e.stopPropagation()}>
                    PT Launch Lab Terms and Conditions
                  </a>.
                </Check>
              </div>
            </div>

            {/* Signature */}
            <div className={`bg-deep border rounded-2xl p-6 ${errors.signature ? "border-red-500/40" : "border-white/10"}`}>
              <h2 className="text-white font-bold text-lg mb-1">Your Signature</h2>
              <p className="text-soft text-sm mb-5 leading-relaxed">
                Sign below to confirm your agreement. You can draw your signature or type your full name.
              </p>

              <div className="flex gap-2 mb-5">
                {(["drawn", "typed"] as const).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setSignMode(m); clearCanvas(); setTypedSig(""); }}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      signMode === m ? "bg-gold text-deep" : "border border-white/[0.15] text-faint hover:border-gold/40 hover:text-gold"
                    }`}>
                    {m === "drawn" ? "Draw Signature" : "Type Name"}
                  </button>
                ))}
              </div>

              {signMode === "drawn" ? (
                <div>
                  <div className="relative border-2 border-dashed border-white/[0.15] rounded-xl overflow-hidden bg-deep">
                    <canvas ref={canvasRef} width={600} height={160} className="w-full touch-none cursor-crosshair block" />
                    <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/[0.15] text-xs pointer-events-none select-none">Draw your signature here</p>
                  </div>
                  <button type="button" onClick={clearCanvas} className="mt-2 text-xs text-faint hover:text-gold transition-colors">↺ Clear and start again</button>
                </div>
              ) : (
                <div>
                  <input type="text" value={typedSig} onChange={e => setTypedSig(e.target.value)}
                    placeholder="Type your full legal name"
                    className={input + " text-xl font-light italic"}
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }} />
                  <p className="text-faint text-xs mt-2">By typing your name you confirm it acts as your electronic signature.</p>
                </div>
              )}

              {errors.signature && <p className="text-red-400 text-xs mt-3">⚠ {errors.signature}</p>}

              <p className="text-faint text-xs mt-4 pt-4 border-t border-white/10">
                Date of signature: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          {step > 1 ? (
            <button onClick={back} disabled={submitting}
              className="px-6 py-3 rounded-full border border-white/10 text-soft text-sm font-semibold hover:border-gold/40 hover:text-gold transition-all disabled:opacity-50">
              ← Back
            </button>
          ) : <div />}
          <button onClick={next} disabled={submitting}
            className="px-8 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-gold/20 disabled:opacity-60 disabled:cursor-not-allowed">
            {step === 3 ? (submitting ? "Confirming your enrolment…" : "Confirm Enrolment →") : "Continue →"}
          </button>
        </div>
      </div>
    </main>
  );
}
