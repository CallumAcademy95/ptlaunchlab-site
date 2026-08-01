"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import {
  buildAgreementClauses,
  KEY_TERMS_FOR_ACKNOWLEDGEMENT,
  PARTNERSHIP_AGREEMENT_VERSION,
} from "@/app/lib/partnershipAgreement";

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
  // The signer must reach the end of the agreement and positively tick the
  // key-terms acknowledgement before the signature is accepted. This is what
  // gives the onerous clauses (5.8–5.9 clawback, 14 non-solicitation) the fair
  // notice they need to be incorporated.
  const [readToEnd, setReadToEnd] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const signedAt = useRef(new Date().toISOString());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef<{ x: number; y: number } | null>(null);

  const gymFullName = details.gymName.toLowerCase().trim().endsWith("ltd")
    ? details.gymName.trim()
    : `${details.gymName.trim()} Ltd`;

  const clauses = buildAgreementClauses({
    gymFullName,
    companyNumber: details.companyNumber,
    registeredAddress: details.registeredAddress,
    repEmail: details.repEmail,
    signedDate: new Date(signedAt.current).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    }),
  });

  const checkScrolledToEnd = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    // Also true when the content is short enough not to scroll at all.
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReadToEnd(true);
  }, []);

  // Content shorter than the box would otherwise never fire a scroll event.
  useEffect(() => {
    if (step === 2) checkScrolledToEnd(scrollRef.current);
  }, [step, checkScrolledToEnd]);

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
    if (!acknowledged) {
      setErrors({ acknowledged: "Please confirm you have read the agreement before signing" });
      return;
    }
    const sig = captureSignature();
    if (!sig || isSignatureEmpty()) {
      setErrors({ signature: "Please add your signature before submitting" });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
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
          gymSignature: sig,
          gymSignatureType: signMode,
          signatureType: signMode,
          signedAt: signedAt.current,
          acknowledgedKeyTerms: acknowledged,
          agreementVersion: PARTNERSHIP_AGREEMENT_VERSION,
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
        {/* Key commercial terms — shown BEFORE the full agreement so the terms
            that cost the partner money are never buried in the scroll box. */}
        <div className="bg-[#0A2A44] border-2 border-[#F5C518]/40 rounded-2xl overflow-hidden">
          <div className="bg-[#F5C518] px-6 py-3">
            <p className="text-[#072B4A] text-xs font-bold tracking-widest uppercase">
              Key terms — please read
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {KEY_TERMS_FOR_ACKNOWLEDGEMENT.map((t) => (
              <div key={t.clause} className="flex gap-3">
                <span className="shrink-0 mt-0.5 text-[#F5C518] text-[10px] font-bold tracking-wider uppercase w-20">
                  {t.clause}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{t.title}</p>
                  <p className="text-[#8CA3BF] text-[13px] leading-relaxed mt-0.5">{t.detail}</p>
                </div>
              </div>
            ))}
            <p className="text-[#4A6280] text-xs pt-2 border-t border-[#1A3A5C]">
              This summary is for convenience only. The full Agreement below sets out the binding terms and takes precedence.
            </p>
          </div>
        </div>

        {/* Agreement text — rendered from the same source as the signed PDF */}
        <div className="bg-[#0A2A44] border border-[#1A3A5C] rounded-2xl overflow-hidden">
          <div className="bg-[#072B4A] px-6 py-4 border-b border-[#1A3A5C]">
            <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase">
              PT Launch Lab Gym Partnership Agreement · v{PARTNERSHIP_AGREEMENT_VERSION}
            </p>
            <h2 className="text-white font-bold text-lg mt-1">Review the Agreement</h2>
            <p className="text-[#4A6280] text-sm mt-1">
              This is the full agreement. The PDF emailed to you is this document, word for word.
              Scroll to the end to continue.
            </p>
          </div>
          <div
            ref={scrollRef}
            onScroll={(e) => checkScrolledToEnd(e.currentTarget)}
            className="px-6 py-5 max-h-[420px] overflow-y-auto space-y-5 text-[13px] leading-relaxed"
          >
            {clauses.map((clause) => (
              <div key={clause.number}>
                <p className="text-[#F5C518] font-bold mb-1.5">
                  {clause.number}. {clause.title}
                </p>
                <div className="space-y-1.5">
                  {clause.blocks.map((block, i) => {
                    if (block.kind === "bullet")
                      return (
                        <p key={i} className="text-[#8CA3BF] pl-4 relative">
                          <span className="absolute left-0 text-[#F5C518]/60">•</span>
                          {block.text}
                        </p>
                      );
                    if (block.kind === "sub")
                      return (
                        <p key={i} className="text-[#6A82A0] pl-8 relative text-xs">
                          <span className="absolute left-4 text-[#F5C518]/40">◦</span>
                          {block.text}
                        </p>
                      );
                    return <p key={i} className="text-[#8CA3BF]">{block.text}</p>;
                  })}
                </div>
              </div>
            ))}
            <p className="text-[#4A6280] text-xs pt-3 border-t border-[#1A3A5C]">
              End of agreement — version {PARTNERSHIP_AGREEMENT_VERSION}.
            </p>
          </div>
          {!readToEnd && (
            <div className="bg-[#072B4A] px-6 py-2.5 border-t border-[#1A3A5C]">
              <p className="text-[#F5C518] text-xs">↓ Scroll to the end of the agreement to continue</p>
            </div>
          )}
        </div>

        {/* Acknowledgement */}
        <div className={`rounded-2xl border p-5 transition-colors ${
          acknowledged ? "bg-[#0A2A44] border-[#F5C518]/40" : "bg-[#0A2A44] border-[#1A3A5C]"
        }`}>
          <label className={`flex gap-3 ${readToEnd ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
            <input
              type="checkbox"
              disabled={!readToEnd}
              checked={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.checked);
                if (errors.acknowledged) setErrors(prev => { const n = { ...prev }; delete n.acknowledged; return n; });
              }}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#F5C518]"
            />
            <span className="text-[#8CA3BF] text-sm leading-relaxed">
              I have read the full Agreement, including{" "}
              <strong className="text-white">Clause 5</strong> (the £500 fee, that it is inclusive of VAT,
              when it is released, and the clawback if a learner is refunded) and{" "}
              <strong className="text-white">Clause 14</strong> (learner non-solicitation). I confirm I am
              authorised to sign on behalf of{" "}
              <strong className="text-white">{details.gymName || "the gym"}</strong>.
            </span>
          </label>
          {errors.acknowledged && <p className="text-red-400 text-xs mt-2">⚠ {errors.acknowledged}</p>}
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
            disabled={submitting || !acknowledged}
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
