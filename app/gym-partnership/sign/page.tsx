"use client";
import { useState, useRef, useEffect } from "react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { generatePartnershipAgreementPDFBase64 } from "@/app/lib/generatePartnershipAgreementPDF";

// ─── Agreement text (mirrors PDF content) ────────────────────────────────────
const AGREEMENT_CLAUSES = [
  {
    heading: "1. Parties",
    body: `This Agreement is entered into between PT Launch Lab Ltd, a company registered in England and Wales (Company No: 16596168), whose registered office is at Unit 3, Royals Business Park, Pontefract, West Yorkshire, WF8 4AH ("PT Launch Lab"); and the Gym Partner named and identified in the signature block below ("Gym Partner").`,
  },
  {
    heading: "2. Purpose",
    body: `PT Launch Lab operates an online personal training education programme delivering NCFE-accredited Level 2 and Level 3 qualifications in Gym Instructing and Personal Training. This Agreement sets out the terms on which the Gym Partner will collaborate with PT Launch Lab to support learner development and, where appropriate, facilitate employment or self-employment opportunities for qualified learners at the Gym Partner's facilities.`,
  },
  {
    heading: "3. Gym Partner Commitments",
    body: `The Gym Partner agrees to: (a) Provide at least one guaranteed interview opportunity to PT Launch Lab learners who have completed and passed all required course modules and assessments, when requested by PT Launch Lab; (b) Engage in good faith with PT Launch Lab learners referred for interview, providing timely responses and professional conduct throughout any recruitment process; (c) Permit PT Launch Lab to reference the Gym Partner by name and use its logo and branding in marketing materials, course content, and learner communications, solely for the purpose of promoting the partnership and the guaranteed interview benefit; (d) Notify PT Launch Lab promptly of any changes to its recruitment capacity, gym operations, or contact details that may affect the terms of this Agreement.`,
  },
  {
    heading: "4. PT Launch Lab Commitments",
    body: `PT Launch Lab agrees to: (a) Refer only learners who have fully completed and passed all required course modules, assessments, and business preparation activities to the Gym Partner for interview; (b) Ensure all referred learners hold a valid NCFE Level 2 and Level 3 qualification at the point of referral; (c) Prepare learners professionally for gym employment, including CV guidance, client acquisition training, and industry awareness; (d) Seek prior written approval from the Gym Partner before using any new branding, imagery, or materials that have not previously been agreed; (e) Respect the Gym Partner's recruitment processes and not represent or imply guaranteed employment to learners.`,
  },
  {
    heading: "5. Learner Referrals",
    body: `Referrals will be made on an ongoing basis as learners qualify. PT Launch Lab will provide the Gym Partner with a learner profile and CV in advance of each referral. The Gym Partner is under no obligation to offer employment to any referred learner; this Agreement provides for interview access only. The number of concurrent referrals will be agreed between the parties in advance and kept proportionate to the Gym Partner's reasonable capacity.`,
  },
  {
    heading: "6. Financial Arrangements",
    body: `No fees are payable by the Gym Partner to PT Launch Lab under this Agreement, and no fees are payable by PT Launch Lab to the Gym Partner in respect of interview access or employment outcomes. Any commercial arrangement outside the scope of this Agreement (including sponsorship, advertising, or revenue sharing) shall be documented in a separate written agreement.`,
  },
  {
    heading: "7. Branding and Intellectual Property",
    body: `Each party retains ownership of its own intellectual property, including but not limited to trademarks, logos, and branding. The Gym Partner grants PT Launch Lab a non-exclusive, royalty-free licence to use the Gym Partner's name and logo solely in connection with promoting the partnership as described in Clause 3(c). PT Launch Lab grants the Gym Partner a non-exclusive, royalty-free licence to reference the PT Launch Lab name in connection with promoting its status as a PT Launch Lab partner gym. Neither party may sublicence, modify, or use the other's branding outside the scope of this Agreement without prior written consent.`,
  },
  {
    heading: "8. Confidentiality",
    body: `Each party agrees to keep confidential any non-public information shared by the other party in the course of this Agreement, including but not limited to learner data, business information, and course materials. Neither party shall disclose such information to any third party without the prior written consent of the disclosing party, except where required by law or a regulatory authority. This clause survives termination of this Agreement.`,
  },
  {
    heading: "9. Data Protection",
    body: `Each party shall comply with all applicable data protection legislation, including the UK GDPR and the Data Protection Act 2018. Learner personal data shared between the parties shall be limited to what is strictly necessary for the purposes of this Agreement and handled in accordance with each party's privacy policy. Each party shall be an independent data controller in respect of any personal data it processes in connection with this Agreement. The parties shall, on request, provide reasonable assistance to each other to ensure compliance with their respective data protection obligations.`,
  },
  {
    heading: "10. Exclusivity",
    body: `This Agreement is non-exclusive. PT Launch Lab may enter into similar partnership agreements with other gym operators, and the Gym Partner may enter into similar arrangements with other training providers. Nothing in this Agreement prevents either party from operating independently or pursuing other commercial relationships.`,
  },
  {
    heading: "11. Liability",
    body: `Neither party shall be liable to the other for any indirect, consequential, or economic losses arising out of or in connection with this Agreement, including but not limited to loss of revenue, loss of anticipated profits, or loss of business opportunity. PT Launch Lab's aggregate liability to the Gym Partner under this Agreement shall not exceed £1,000. Nothing in this Agreement shall exclude or limit liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded under applicable law.`,
  },
  {
    heading: "12. Representations and Warranties",
    body: `Each party represents and warrants that: (a) it has full power and authority to enter into and perform this Agreement; (b) the person signing this Agreement on its behalf is duly authorised to do so; (c) the execution and performance of this Agreement does not conflict with any other agreement, obligation, or applicable law.`,
  },
  {
    heading: "13. Term",
    body: `This Agreement commences on the date it is signed by both parties and continues until terminated in accordance with Clause 14. There is no fixed end date.`,
  },
  {
    heading: "14. Termination",
    body: `Either party may terminate this Agreement at any time by providing 30 days' written notice to the other party. Written notice may be given by email to the contact details recorded in this Agreement or as subsequently notified. Either party may terminate this Agreement immediately on written notice if the other party materially breaches this Agreement and (where the breach is capable of remedy) fails to remedy it within 14 days of receiving written notice requiring it to do so; or becomes insolvent, enters administration, or ceases to trade. On termination, each party shall cease using the other's branding and return or destroy any confidential information held.`,
  },
  {
    heading: "15. Variation",
    body: `No variation to this Agreement shall be effective unless agreed in writing and signed by authorised representatives of both parties.`,
  },
  {
    heading: "16. Entire Agreement",
    body: `This Agreement constitutes the entire agreement between the parties in relation to its subject matter and supersedes all prior discussions, representations, or agreements. Each party acknowledges that it has not relied on any representation or warranty not set out in this Agreement.`,
  },
  {
    heading: "17. Governing Law",
    body: `This Agreement and any dispute arising out of or in connection with it shall be governed by and construed in accordance with the laws of England and Wales. Each party submits to the exclusive jurisdiction of the courts of England and Wales to resolve any dispute arising under or in connection with this Agreement.`,
  },
  {
    heading: "18. Notices",
    body: `Any notice given under this Agreement must be in writing. Notices to PT Launch Lab should be sent to: info@ptlaunchlab.co.uk or Unit 3, Royals Business Park, Pontefract, West Yorkshire, WF8 4AH. Notices to the Gym Partner should be sent to the email address provided in the signature block below.`,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface GymDetails {
  gymName: string;
  companyNumber: string;
  registeredAddress: string;
  repName: string;
  repPosition: string;
  repEmail: string;
}

const blankDetails: GymDetails = {
  gymName: "",
  companyNumber: "",
  registeredAddress: "",
  repName: "",
  repPosition: "",
  repEmail: "",
};

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: "Your Details" },
  { num: 2, label: "Sign Agreement" },
  { num: 3, label: "Confirmed" },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-start justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#1A3A5C]" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-[#F5C518] transition-all duration-500"
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

const inputCls = "w-full bg-[#061F36] border border-[#1A3A5C] rounded-xl px-4 py-3 text-white placeholder-[#2A4A6C] focus:outline-none focus:border-[#F5C518]/50 transition-colors text-sm";

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[#8CA3BF] text-sm mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-[#F5C518] text-xs">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6 space-y-4">
      <h2 className="text-white font-bold text-lg pb-2 border-b border-[#1A3A5C]">{title}</h2>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GymPartnershipSignPage() {
  const [step, setStep]         = useState<Step>(1);
  const [details, setDetails]   = useState<GymDetails>(blankDetails);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [signMode, setSignMode] = useState<"drawn" | "typed">("drawn");
  const [typedSig, setTypedSig] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const signedAt = useRef(new Date().toISOString());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);

  // ─── Canvas signature setup ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2 || signMode !== "drawn") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#F5C518";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: x - r.left, y: y - r.top };
    }
    function down(e: MouseEvent | TouchEvent) {
      e.preventDefault(); isDrawing.current = true; lastPos.current = getPos(e);
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!isDrawing.current || !ctx) return;
      e.preventDefault();
      const p = getPos(e);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  }

  function captureSignature(): string {
    if (signMode === "typed") return typedSig.trim();
    const canvas = canvasRef.current;
    return canvas ? canvas.toDataURL("image/png") : "";
  }

  function isSignatureEmpty(): boolean {
    if (signMode === "typed") return typedSig.trim() === "";
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !px.some((v, i) => i % 4 === 3 && v > 0);
  }

  // ─── Step 1 validation ────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!details.gymName.trim())           e.gymName = "Gym name is required";
    if (!details.companyNumber.trim())     e.companyNumber = "Company number is required";
    if (!details.registeredAddress.trim()) e.registeredAddress = "Registered address is required";
    if (!details.repName.trim())           e.repName = "Your full name is required";
    if (!details.repPosition.trim())       e.repPosition = "Your job title / position is required";
    if (!details.repEmail.trim())          e.repEmail = "Your email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.repEmail)) e.repEmail = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const sig = captureSignature();
    if (!sig || isSignatureEmpty()) {
      setErrors({ signature: "Please add your signature before submitting" });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const { base64, filename } = await generatePartnershipAgreementPDFBase64({
        gymName: details.gymName,
        companyNumber: details.companyNumber,
        registeredAddress: details.registeredAddress,
        repName: details.repName,
        repPosition: details.repPosition,
        repEmail: details.repEmail,
        gymSignature: sig,
        gymSignatureType: signMode,
        signedAt: signedAt.current,
      });

      const res = await fetch("/api/gym-partnership/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymName: details.gymName,
          companyNumber: details.companyNumber,
          registeredAddress: details.registeredAddress,
          repName: details.repName,
          repPosition: details.repPosition,
          repEmail: details.repEmail,
          signatureType: signMode,
          signedAt: signedAt.current,
          pdfBase64: base64,
          pdfFilename: filename,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Server error");
      }
      setStep(3);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function set(field: keyof GymDetails) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDetails(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
  }

  // ─── Step 1: Gym Details ──────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-6">
        <Card title="Gym Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gym / Company Name" required error={errors.gymName}>
              <input className={inputCls} placeholder="e.g. Muscle Bound Gym Ltd" value={details.gymName} onChange={set("gymName")} />
            </Field>
            <Field label="Company Number" required error={errors.companyNumber}>
              <input className={inputCls} placeholder="e.g. 12345678" value={details.companyNumber} onChange={set("companyNumber")} />
            </Field>
          </div>
          <Field label="Registered Address" required error={errors.registeredAddress}>
            <textarea
              className={inputCls + " resize-none"}
              rows={2}
              placeholder="Full registered address including postcode"
              value={details.registeredAddress}
              onChange={set("registeredAddress")}
            />
          </Field>
        </Card>

        <Card title="Authorised Signatory">
          <p className="text-[#4A6280] text-sm">The person signing on behalf of the gym must be authorised to enter into agreements on the company&apos;s behalf.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.repName}>
              <input className={inputCls} placeholder="Your full name" value={details.repName} onChange={set("repName")} />
            </Field>
            <Field label="Position / Job Title" required error={errors.repPosition}>
              <input className={inputCls} placeholder="e.g. Director, Owner, Manager" value={details.repPosition} onChange={set("repPosition")} />
            </Field>
          </div>
          <Field label="Email Address" required error={errors.repEmail}>
            <input className={inputCls} type="email" placeholder="your@email.com" value={details.repEmail} onChange={set("repEmail")} />
          </Field>
        </Card>

        <button
          onClick={() => { if (validateStep1()) setStep(2); }}
          className="w-full py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
        >
          Continue to Agreement →
        </button>
      </div>
    );
  }

  // ─── Step 2: Review & Sign ────────────────────────────────────────────────
  function renderStep2() {
    return (
      <div className="space-y-6">
        {/* Agreement text */}
        <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl overflow-hidden">
          <div className="bg-[#072B4A] px-6 py-4 border-b border-[#1A3A5C]">
            <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase">PT Launch Lab Gym Partnership Agreement</p>
            <h2 className="text-white font-bold text-lg mt-1">Review the Agreement</h2>
            <p className="text-[#4A6280] text-sm mt-1">Read through all clauses before signing. Scroll down to add your signature.</p>
          </div>
          <div className="px-6 py-5 max-h-[420px] overflow-y-auto space-y-5 text-[13px] leading-relaxed">
            {AGREEMENT_CLAUSES.map((clause) => (
              <div key={clause.heading}>
                <p className="text-[#F5C518] font-bold mb-1">{clause.heading}</p>
                <p className="text-[#8CA3BF]">{clause.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signature */}
        <Card title="Your Signature">
          <p className="text-[#4A6280] text-sm">
            By signing below, <strong className="text-white">{details.repName}</strong> confirms they are authorised to sign on behalf of <strong className="text-white">{details.gymName}</strong> and agrees to the terms above.
          </p>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[#1A3A5C]">
            {(["drawn", "typed"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setSignMode(mode); setSignature(""); clearCanvas(); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  signMode === mode
                    ? "bg-[#F5C518] text-[#072B4A]"
                    : "bg-[#061F36] text-[#4A6280] hover:text-white"
                }`}
              >
                {mode === "drawn" ? "Draw Signature" : "Type Signature"}
              </button>
            ))}
          </div>

          {signMode === "drawn" ? (
            <div>
              <div className="relative rounded-xl overflow-hidden border border-[#1A3A5C] bg-[#061F36]">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={140}
                  className="w-full touch-none"
                  style={{ display: "block" }}
                />
                <span className="absolute bottom-2 right-3 text-[#1A3A5C] text-[10px] pointer-events-none select-none">Sign here</span>
              </div>
              <button onClick={clearCanvas} className="mt-2 text-[#4A6280] text-xs hover:text-[#F5C518] transition-colors">
                Clear
              </button>
            </div>
          ) : (
            <div>
              <input
                className={inputCls + " font-serif text-lg italic text-[#F5C518]"}
                placeholder="Type your full name"
                value={typedSig}
                onChange={e => setTypedSig(e.target.value)}
              />
              <p className="text-[#3A5A7C] text-xs mt-1">Typing your full name constitutes a legally binding electronic signature.</p>
            </div>
          )}

          {errors.signature && <p className="text-red-400 text-xs">⚠ {errors.signature}</p>}
        </Card>

        {/* PT Launch Lab pre-signed notice */}
        <div className="bg-[#0A2A44] border border-[#F5C518]/20 rounded-xl px-5 py-4">
          <p className="text-[#F5C518] text-xs font-bold uppercase tracking-widest mb-1">PT Launch Lab</p>
          <p className="text-[#8CA3BF] text-sm">
            This agreement has been pre-signed by <strong className="text-white">Callum Brown</strong>, Director of PT Launch Lab. The date will be recorded as today — {new Date(signedAt.current).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-5 py-4 text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-4 rounded-full border border-[#1A3A5C] text-[#8CA3BF] font-semibold text-sm hover:border-[#F5C518]/40 hover:text-white transition-all"
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending agreement…" : "Sign & Submit Agreement →"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Confirmation ─────────────────────────────────────────────────
  function renderStep3() {
    return (
      <div className="text-center space-y-6 py-6">
        <div className="w-16 h-16 rounded-full bg-[#F5C518] flex items-center justify-center mx-auto">
          <span className="text-[#072B4A] text-3xl font-bold">✓</span>
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold mb-3">Agreement Signed</h2>
          <p className="text-[#8CA3BF] text-base max-w-md mx-auto">
            The signed partnership agreement has been emailed to <strong className="text-white">{details.repEmail}</strong> and to the PT Launch Lab team. Keep the email for your records.
          </p>
        </div>
        <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl p-6 text-left max-w-sm mx-auto space-y-2">
          <p className="text-[#F5C518] text-xs font-bold uppercase tracking-widest mb-3">Agreement Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-[#4A6280]">Gym</span>
            <span className="text-white font-semibold">{details.gymName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#4A6280]">Signed by</span>
            <span className="text-white font-semibold">{details.repName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#4A6280]">Date</span>
            <span className="text-white font-semibold">
              {new Date(signedAt.current).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
        <p className="text-[#4A6280] text-sm">
          Questions? Email us at{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="text-[#F5C518] hover:underline">
            info@ptlaunchlab.co.uk
          </a>
        </p>
      </div>
    );
  }

  // ─── Page shell ───────────────────────────────────────────────────────────
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#061F36] pt-20 pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-3">Gym Partnership</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Partnership Agreement</h1>
            <p className="text-[#8CA3BF] text-base">
              Sign your PT Launch Lab gym partner agreement digitally. Both parties will receive a signed PDF copy by email.
            </p>
          </div>

          {step < 3 && <ProgressBar step={step} />}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </main>
      <Footer />
    </>
  );
}
