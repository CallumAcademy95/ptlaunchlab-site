"use client";
import { useState, useRef, useEffect } from "react";
import { trackEvent } from "@/app/lib/gtag";
import { generateEnrolmentPDFBase64 } from "../lib/generateEnrolmentPDF";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

// ─── CONFIGURATION — replace these placeholders before going live ─────────────
const FULL_PAYMENT_STRIPE_LINK  = "https://buy.stripe.com/bJecMZ4Ew6de52q4EifEk09";
const DEPOSIT_STRIPE_LINK       = "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05";
const TERMS_URL                 = "/terms";
const SUPPORT_EMAIL             = "info@ptlaunchlab.co.uk";       // TODO: Support email
const SUPPORT_PHONE             = "01977 365001";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Partner config (passed in from gym-specific enrol pages) ─────────────────
export interface PartnerConfig {
  gymReferral: string;          // e.g. "6fit Gyms"
  promoCodes: Record<string, { // key = code (uppercase), value = discount config
    label: string;              // e.g. "6fit Member Discount"
    discountAmount: number;     // e.g. 200
    fullPrice: number;          // discounted full price e.g. 1199
    depositPrice: number;       // discounted deposit e.g. 399
    fullStripeLink: string;     // Stripe link for discounted full payment
    depositStripeLink: string;  // Stripe link for discounted deposit
  }>;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────
interface LearnerDetails {
  title: string; fullName: string; dateOfBirth: string; gender: string;
  nationalInsurance: string; mobile: string; email: string;
  addressLine1: string; addressLine2: string; town: string; county: string; postcode: string;
}
interface LearningDetails {
  heardAbout: string; highestQualification: string;
  gcseEnglish: string; gcseMaths: string; gcseICT: string; employmentStatus: string;
}
interface AgreementState {
  detailsAccurate: boolean; selfFunded: boolean;
  coolingOffUnderstood: boolean; termsAgreed: boolean; commitToLearning: boolean;
  signature: string; signatureType: "drawn" | "typed"; signedAt: string;
}

const blankLearner: LearnerDetails = {
  title: "", fullName: "", dateOfBirth: "", gender: "",
  nationalInsurance: "", mobile: "", email: "",
  addressLine1: "", addressLine2: "", town: "", county: "", postcode: "",
};
const blankLearning: LearningDetails = {
  heardAbout: "", highestQualification: "",
  gcseEnglish: "", gcseMaths: "", gcseICT: "", employmentStatus: "",
};
const blankAgreement: AgreementState = {
  detailsAccurate: false, selfFunded: false,
  coolingOffUnderstood: false, termsAgreed: false, commitToLearning: false,
  signature: "", signatureType: "drawn", signedAt: "",
};

type Step = 1 | 2 | 3 | 4;

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Learning Info" },
  { num: 3, label: "Agreement" },
  { num: 4, label: "Payment" },
];

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="w-full mb-12">
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#1A3A5C]" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-[#F5C518] transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} className="relative flex flex-col items-center z-10 flex-1 first:items-start last:items-end">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done    ? "bg-[#F5C518] text-[#072B4A]" :
                active  ? "bg-[#F5C518] text-[#072B4A] ring-4 ring-[#F5C518]/25" :
                          "bg-[#0A2A44] border-2 border-[#1A3A5C] text-[#3A5A7C]"
              }`}>
                {done ? "✓" : s.num}
              </div>
              <span className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${
                active ? "text-[#F5C518]" : done ? "text-[#F5C518]/60" : "text-[#3A5A7C]"
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

// ─── Shared field wrapper ─────────────────────────────────────────────────────
function Field({ label, error, required, hint, children }: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[#8CA3BF] text-sm mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-[#F5C518] text-xs">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[#3A5A7C] text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
    </div>
  );
}

const input = "w-full bg-[#061F36] border border-[#1A3A5C] rounded-xl px-4 py-3 text-white placeholder-[#2A4A6C] focus:outline-none focus:border-[#F5C518]/50 transition-colors text-sm";
const sel   = input + " cursor-pointer";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6 space-y-4">
      <h2 className="text-white font-bold text-lg pb-2 border-b border-[#1A3A5C]">{title}</h2>
      {children}
    </div>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────
function Check({ checked, onChange, error, children }: {
  checked: boolean; onChange: (v: boolean) => void; error?: boolean; children: React.ReactNode;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all ${
      checked ? "border-[#F5C518]/40 bg-[#F5C518]/5" :
      error   ? "border-red-500/40 bg-red-500/5" :
                "border-[#1A3A5C] hover:border-[#2A4A6C]"
    }`}>
      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
        checked ? "bg-[#F5C518] border-[#F5C518]" : "border-[#2A4A6C]"
      }`}>
        {checked && <span className="text-[#072B4A] text-xs font-bold leading-none">✓</span>}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-[#8CA3BF] text-sm leading-relaxed">{children}</span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EnrolmentFlow({ partner, standalone }: { partner?: PartnerConfig; standalone?: boolean }) {
  const [step, setStep]         = useState<Step>(1);
  const [learner, setL]         = useState<LearnerDetails>(blankLearner);
  const [learning, setLn]       = useState<LearningDetails>({
    ...blankLearning,
    heardAbout: partner?.gymReferral ? `${partner.gymReferral} (Gym Referral)` : "",
  });
  const [agreement, setA]       = useState<AgreementState>(blankAgreement);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [signMode, setSignMode] = useState<"drawn" | "typed">("drawn");
  const [submitting, setSubmitting] = useState(false);
  const [typedSig, setTypedSig] = useState("");
  const [promoInput, setPromoInput]   = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError]   = useState("");
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const isDrawing               = useRef(false);
  const lastPos                 = useRef<{ x: number; y: number } | null>(null);

  // ─── Canvas signature ──────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || signMode !== "drawn") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#F5C518";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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
      if (!isDrawing.current || !ctx) return;
      e.preventDefault();
      const p = pos(e);
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
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

  // ─── Promo code ────────────────────────────────────────────────────────────
  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (partner?.promoCodes[code]) {
      setAppliedPromo(code);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code — please check and try again.");
    }
  }
  const activePromo = appliedPromo ? partner?.promoCodes[appliedPromo] : null;

  // ─── Validation ────────────────────────────────────────────────────────────
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

  // ─── Navigation ────────────────────────────────────────────────────────────
  function next() {
    const errs = step === 1 ? v1() : step === 2 ? v2() : step === 3 ? v3() : {};
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({});
    if (step === 3) {
      setA(a => ({ ...a, signature: getSig(), signatureType: signMode, signedAt: new Date().toISOString() }));
    }
    setStep(s => (s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setStep(s => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── Payment ───────────────────────────────────────────────────────────────
  async function pay(type: "full" | "deposit") {
    if (submitting) return;
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
        signature: agreement.signature || getSig(),
        signatureType: agreement.signatureType || signMode,
        signedAt: agreement.signedAt || new Date().toISOString(),
      },
      paymentChoice: type,
      submittedAt: new Date().toISOString(),
      source: "website-enrolment-flow-v1",
      amountPaid: type === "full"
        ? (activePromo ? activePromo.fullPrice : 1599)
        : (activePromo ? activePromo.depositPrice : 599),
      ...(partner?.gymReferral  && { gymReferral: partner.gymReferral }),
      ...(appliedPromo           && { promoCode: appliedPromo, discountApplied: activePromo?.discountAmount }),
    };

    // Persist locally as backup
    try { localStorage.setItem("ptll_enrolment_pending", JSON.stringify(record)); } catch (_) {}

    // Generate PDF once — attach to email AND trigger browser download
    let pdfBase64: string | undefined;
    let pdfFilename: string | undefined;
    try {
      const pdf = await generateEnrolmentPDFBase64(record);
      pdfBase64 = pdf.base64;
      pdfFilename = pdf.filename;
      // Trigger download from the base64 we already have (avoids building twice)
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = pdfFilename;
      link.click();
    } catch (_) {
      console.warn("PDF generation failed — continuing to payment.");
    }

    // Send to server (Zapier + Resend emails with PDF attached)
    try {
      await fetch("/api/enrolments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, pdfBase64, pdfFilename }),
      });
    } catch (_) {
      console.warn("Enrolment API call failed — continuing to payment.");
    }

    trackEvent('enrol_complete', { payment_type: type, ...(appliedPromo && { promo: appliedPromo }) });
    const fullLink    = activePromo?.fullStripeLink    ?? FULL_PAYMENT_STRIPE_LINK;
    const depositLink = activePromo?.depositStripeLink ?? DEPOSIT_STRIPE_LINK;
    window.location.href = type === "full" ? fullLink : depositLink;
  }

  const firstName = learner.fullName.split(" ")[0];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {!standalone && <Nav />}
      <main className={`${standalone ? "" : "pt-[72px]"} min-h-screen bg-[#061F36]`}>
        <div className="max-w-2xl mx-auto px-5 py-16">

          {/* Page header */}
          <div className="text-center mb-10">
            <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-3">
              PT Launch Lab — Enrolment
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {step === 1 && "Your Details"}
              {step === 2 && "Learning Information"}
              {step === 3 && "Agree & Sign"}
              {step === 4 && `You're almost in, ${firstName || "almost there"}.`}
            </h1>
            <p className="text-[#8CA3BF] text-sm">
              {step === 1 && "Step 1 of 4 — Personal details. Takes about 2 minutes."}
              {step === 2 && "Step 2 of 4 — A few background questions for your learner record."}
              {step === 3 && "Step 3 of 4 — Review your learner agreement and add your signature."}
              {step === 4 && "Step 4 of 4 — Choose your payment option to complete enrolment."}
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — Learner Details                                       */}
          {/* ═══════════════════════════════════════════════════════════════ */}
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
                    <Field label="Full Legal Name" required error={errors.fullName}
                      hint="As it appears on official ID or documents">
                      <input type="text" value={learner.fullName}
                        onChange={e => setL({ ...learner, fullName: e.target.value })}
                        placeholder="e.g. Jane Emily Smith" className={input} />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date of Birth" required error={errors.dateOfBirth}>
                    <input type="date" value={learner.dateOfBirth}
                      onChange={e => setL({ ...learner, dateOfBirth: e.target.value })}
                      className={input} />
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — Learning Information                                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">
              {partner?.gymReferral ? (
                // Referral source is known — no need to ask, just confirm visually
                <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl px-5 py-4 flex items-center gap-3">
                  <span className="text-[#F5C518] text-sm">✔</span>
                  <p className="text-[#8CA3BF] text-sm">Referred by <span className="text-white font-semibold">{partner.gymReferral}</span></p>
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

                <p className="text-[#8CA3BF] text-xs">GCSE grades — leave blank if not applicable</p>
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 3 — Agreement & Signature                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6">
                <h2 className="text-white font-bold text-xl mb-2">Learner Agreement</h2>
                <p className="text-[#8CA3BF] text-sm leading-relaxed mb-6">
                  Please read the following carefully. This confirms your commitment and your understanding of key terms before you proceed to payment.
                </p>

                {/* Refund terms */}
                <div className="space-y-3 mb-6">
                  <div className="bg-[#061F36] border border-[#1A3A5C] rounded-xl p-5">
                    <p className="text-[#F5C518] text-[10px] font-bold tracking-widest uppercase mb-3">
                      Full Payment — Refund Terms
                    </p>
                    <ul className="text-[#8CA3BF] text-sm space-y-2 leading-relaxed">
                      <li>• You are eligible for a full refund if you cancel within 14 days of payment (the cooling off period).</li>
                      <li>• After the 14-day cooling off period, refunds are not normally available for a change of mind.</li>
                      <li>• Your statutory rights under applicable UK law are not affected by this agreement.</li>
                    </ul>
                  </div>
                  <div className="bg-[#061F36] border border-[#1A3A5C] rounded-xl p-5">
                    <p className="text-[#F5C518] text-[10px] font-bold tracking-widest uppercase mb-3">
                      Deposit & Monthly Payments — Refund Terms
                    </p>
                    <ul className="text-[#8CA3BF] text-sm space-y-2 leading-relaxed">
                      <li>• You are eligible for a full refund of your deposit if you cancel within 14 days of payment (the cooling off period).</li>
                      <li>• After the 14-day cooling off period, your deposit is not normally refundable for a change of mind.</li>
                      <li>• Your statutory rights under applicable UK law are not affected by this agreement.</li>
                    </ul>
                  </div>
                </div>

                {/* Checkboxes */}
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
                    <a href={TERMS_URL} target="_blank" rel="noopener noreferrer"
                      className="text-[#F5C518] hover:underline"
                      onClick={e => e.stopPropagation()}>
                      PT Launch Lab Terms and Conditions
                    </a>.
                    {" "}I also acknowledge that course access and onboarding will begin after my payment is completed.
                  </Check>
                </div>
              </div>

              {/* Signature */}
              <div className={`bg-[#0A2A44] border rounded-2xl p-6 ${errors.signature ? "border-red-500/40" : "border-[#1A3A5C]"}`}>
                <h2 className="text-white font-bold text-lg mb-1">Your Signature</h2>
                <p className="text-[#8CA3BF] text-sm mb-5 leading-relaxed">
                  Sign below to confirm your agreement. You can draw your signature or type your full name.
                </p>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-5">
                  {(["drawn", "typed"] as const).map(m => (
                    <button key={m} type="button"
                      onClick={() => { setSignMode(m); clearCanvas(); setTypedSig(""); }}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        signMode === m
                          ? "bg-[#F5C518] text-[#072B4A]"
                          : "border border-[#2A4A6C] text-[#3A5A7C] hover:border-[#F5C518]/40 hover:text-[#F5C518]"
                      }`}>
                      {m === "drawn" ? "✏ Draw Signature" : "⌨ Type Name"}
                    </button>
                  ))}
                </div>

                {signMode === "drawn" ? (
                  <div>
                    <div className="relative border-2 border-dashed border-[#2A4A6C] rounded-xl overflow-hidden bg-[#061F36]">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={160}
                        className="w-full touch-none cursor-crosshair block"
                      />
                      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[#2A4A6C] text-xs pointer-events-none select-none">
                        Draw your signature here
                      </p>
                    </div>
                    <button type="button" onClick={clearCanvas}
                      className="mt-2 text-xs text-[#3A5A7C] hover:text-[#F5C518] transition-colors">
                      ↺ Clear and start again
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={typedSig}
                      onChange={e => setTypedSig(e.target.value)}
                      placeholder="Type your full legal name"
                      className={input + " text-xl font-light italic"}
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    />
                    <p className="text-[#3A5A7C] text-xs mt-2">
                      By typing your name you confirm it acts as your electronic signature.
                    </p>
                  </div>
                )}

                {errors.signature && (
                  <p className="text-red-400 text-xs mt-3">⚠ {errors.signature}</p>
                )}

                <p className="text-[#3A5A7C] text-xs mt-4 pt-4 border-t border-[#1A3A5C]">
                  Date of signature: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 4 — Payment Choice                                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-5 text-center">
                <p className="text-[#8CA3BF] text-sm leading-relaxed">
                  Once your payment is completed you&apos;ll automatically receive a welcome email with your course access links and onboarding information. You can start the same day.
                </p>
              </div>

              {/* Promo code — only shown if partner config has promoCodes */}
              {partner?.promoCodes && (
                <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-xl p-4">
                  {appliedPromo && activePromo ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#F5C518] font-bold text-sm">
                          ✓ {activePromo.label} applied — £{activePromo.discountAmount} off
                        </p>
                        <p className="text-[#8CA3BF] text-xs mt-0.5">Enter this code at Stripe checkout to apply your discount</p>
                      </div>
                      <button onClick={() => { setAppliedPromo(null); setPromoInput(""); }} className="text-[#3A5A7C] text-xs hover:text-[#8CA3BF] transition-colors">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[#8CA3BF] text-sm mb-2 font-semibold">Have a promo code?</p>
                      <div className="flex gap-2">
                        <input
                          value={promoInput}
                          onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                          placeholder="Enter code"
                          className="flex-1 bg-[#061F36] border border-[#1A3A5C] rounded-lg px-3 py-2 text-white placeholder-[#2A4A6C] text-sm focus:outline-none focus:border-[#F5C518]/50 transition-colors uppercase"
                        />
                        <button
                          onClick={applyPromo}
                          className="px-4 py-2 rounded-lg bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <p className="text-red-400 text-xs mt-1.5">{promoError}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Payment options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full payment */}
                <button onClick={() => pay("full")} disabled={submitting}
                  className="bg-[#0A2A44] border-2 border-[#F5C518]/50 hover:border-[#F5C518] hover:bg-[#F5C518]/5 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                  <p className="text-[#F5C518] text-[10px] font-bold tracking-widest uppercase mb-3">Best Value</p>
                  <p className="text-white font-bold text-2xl mb-1">Pay in Full</p>
                  {activePromo ? (
                    <div className="mb-3">
                      <p className="text-[#3A5A7C] text-2xl font-bold line-through leading-none">£1,599</p>
                      <p className="text-[#F5C518] text-4xl font-bold leading-none">£{activePromo.fullPrice.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-[#F5C518] text-4xl font-bold mb-3">£1,599</p>
                  )}
                  <ul className="text-[#8CA3BF] text-xs space-y-1.5 mb-6">
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> {activePromo ? `Save £${(1599 - activePromo.fullPrice).toLocaleString()}` : "Save £200"}</li>
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> Immediate course access</li>
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> One single payment</li>
                  </ul>
                  <div className="w-full py-3.5 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm text-center group-hover:brightness-110 transition-all">
                    {submitting ? "Preparing your documents…" : `Pay £${activePromo ? activePromo.fullPrice.toLocaleString() : "1,599"} →`}
                  </div>
                </button>

                {/* Deposit plan */}
                <button onClick={() => pay("deposit")} disabled={submitting}
                  className="bg-[#0A2A44] border-2 border-[#1A3A5C] hover:border-[#F5C518]/40 rounded-2xl p-7 text-left transition-all group w-full disabled:opacity-60 disabled:cursor-not-allowed">
                  <p className="text-[#8CA3BF] text-[10px] font-bold tracking-widest uppercase mb-3">Spread the Cost</p>
                  <p className="text-white font-bold text-2xl mb-1">Deposit Plan</p>
                  {activePromo ? (
                    <div className="mb-1">
                      <p className="text-[#3A5A7C] text-2xl font-bold line-through leading-none">£599</p>
                      <p className="text-[#F5C518] text-4xl font-bold leading-none">£{activePromo.depositPrice}</p>
                    </div>
                  ) : (
                    <p className="text-[#F5C518] text-4xl font-bold mb-1">£599</p>
                  )}
                  <p className="text-[#8CA3BF] text-xs mb-3">then £200 × {activePromo ? Math.round((activePromo.fullPrice - activePromo.depositPrice) / 200) : 5} monthly payments</p>
                  <ul className="text-[#8CA3BF] text-xs space-y-1.5 mb-6">
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> Start today with a deposit</li>
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> Monthly payments to follow</li>
                    <li className="flex items-center gap-2"><span className="text-[#F5C518]">✓</span> Full access from day one</li>
                  </ul>
                  <div className="w-full py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-bold text-sm text-center group-hover:bg-[#F5C518]/10 transition-all">
                    {submitting ? "Preparing your documents…" : `Pay £${activePromo ? activePromo.depositPrice : "599"} Deposit →`}
                  </div>
                </button>
              </div>

              {/* Finance */}
              <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-xl p-4 text-center">
                <p className="text-[#8CA3BF] text-sm">
                  Finance available via Payl8r over 12–18 months.{" "}
                  <a href="/book-call" className="text-[#F5C518] hover:underline">Book a free call</a>
                  {" "}and we&apos;ll walk you through it.
                </p>
              </div>

              {/* Support */}
              <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6 text-center">
                <p className="text-white font-bold mb-2">Need help before you continue?</p>
                <p className="text-[#8CA3BF] text-sm mb-5">
                  If you have any questions before choosing your payment option, the team is here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4 text-sm">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#F5C518] hover:underline">
                    📧 {SUPPORT_EMAIL}
                  </a>
                  <span className="hidden sm:inline text-[#1A3A5C]">·</span>
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="text-[#F5C518] hover:underline">
                    📞 {SUPPORT_PHONE}
                  </a>
                </div>
                <a href="/book-call"
                  className="inline-block px-6 py-2.5 rounded-full border border-[#F5C518] text-[#F5C518] text-sm font-semibold hover:bg-[#F5C518] hover:text-[#072B4A] transition-all">
                  Talk to the Team
                </a>
              </div>

              <div className="text-center pt-2">
                <button onClick={back} className="text-[#3A5A7C] text-sm hover:text-[#8CA3BF] transition-colors">
                  ← Back to agreement
                </button>
              </div>
            </div>
          )}

          {/* Step navigation */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1A3A5C]">
              {step > 1 ? (
                <button onClick={back}
                  className="px-6 py-3 rounded-full border border-[#1A3A5C] text-[#8CA3BF] text-sm font-semibold hover:border-[#F5C518]/40 hover:text-[#F5C518] transition-all">
                  ← Back
                </button>
              ) : (
                <div />
              )}
              <button onClick={next}
                className="px-8 py-3.5 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
                {step === 3 ? "Confirm & Choose Payment →" : "Continue →"}
              </button>
            </div>
          )}

        </div>
      </main>
      {!standalone && <Footer />}
    </>
  );
}
