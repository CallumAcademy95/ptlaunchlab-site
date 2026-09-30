"use client";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useFormSecurity } from "@/app/lib/security/client";
import { WHATSAPP_DISPLAY, WHATSAPP_LINK } from "@/app/lib/contactDetails";

// The referral form the enrolled-learner nurture points at. Every third email
// in that 52-week sequence asks for a referral, and until this page existed the
// only route was "WhatsApp us or reply to this email", which left no record of
// who was owed the £200.
//
// Deliberately short: name, one way to reach them, and who to pay. Anything
// else is a reason not to finish it.

const REWARD = "£200";

export default function ReferPage() {
  const [form, setForm] = useState({
    referrer_name: "",
    referrer_email: "",
    referred_name: "",
    referred_email: "",
    referred_phone: "",
    note: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const sec = useFormSecurity();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/refer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [sec.SEC_KEY]: sec.payload() }),
      });
      const json = await res.json().catch(() => ({ success: false }));
      if (json.success) {
        setState("done");
      } else {
        setError(json.error || "Something went wrong. Please try again.");
        setState("idle");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  const field =
    "w-full rounded-lg bg-[#0B1F35] border border-[#1E3A5C] text-white px-4 py-3 " +
    "placeholder-[#5B7A9E] focus:outline-none focus:border-[#F5C518] transition-colors";

  return (
    <>
      <Nav />
      <main className="pt-[72px] bg-[#072B4A] min-h-screen">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">
              Refer a friend
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Know someone who&apos;d make
              <br />
              <span className="text-[#F5C518]">a good PT?</span>
            </h1>
            <p className="text-[#8CA3BF] text-lg leading-relaxed mb-4">
              If you refer somebody and they enrol, we&apos;ll pay you {REWARD}.
            </p>
            <p className="text-[#8CA3BF] leading-relaxed mb-10">
              You don&apos;t need to sell anything. Give us their name and a way to reach them,
              and we&apos;ll take it from there. We&apos;ll keep you posted either way.
            </p>

            {state === "done" ? (
              <div className="rounded-xl border border-[#F5C518] bg-[#0B1F35] p-8">
                <h2 className="text-2xl font-bold text-white mb-3">Got it — thank you.</h2>
                <p className="text-[#8CA3BF] leading-relaxed mb-4">
                  We&apos;ll get in touch with them, and we&apos;ll let you know what happens. If they
                  enrol, we&apos;ll be in contact about your {REWARD}.
                </p>
                <p className="text-[#8CA3BF] leading-relaxed">
                  Thought of someone else?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, referred_name: "", referred_email: "", referred_phone: "", note: "" });
                      setState("idle");
                    }}
                    className="text-[#F5C518] underline"
                  >
                    Refer them too
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset className="space-y-4">
                  <legend className="text-white font-semibold mb-2">Who are you referring?</legend>
                  <div>
                    <label htmlFor="referred_name" className="block text-sm text-[#8CA3BF] mb-2">
                      Their name
                    </label>
                    <input
                      id="referred_name"
                      name="referred_name"
                      required
                      value={form.referred_name}
                      onChange={handleChange}
                      className={field}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referred_email" className="block text-sm text-[#8CA3BF] mb-2">
                        Their email
                      </label>
                      <input
                        id="referred_email"
                        name="referred_email"
                        type="email"
                        value={form.referred_email}
                        onChange={handleChange}
                        className={field}
                      />
                    </div>
                    <div>
                      <label htmlFor="referred_phone" className="block text-sm text-[#8CA3BF] mb-2">
                        Their phone
                      </label>
                      <input
                        id="referred_phone"
                        name="referred_phone"
                        type="tel"
                        value={form.referred_phone}
                        onChange={handleChange}
                        className={field}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[#5B7A9E]">Either one is fine — we just need a way to reach them.</p>
                </fieldset>

                <fieldset className="space-y-4 pt-4 border-t border-[#1E3A5C]">
                  <legend className="text-white font-semibold mb-2">Where do we send your {REWARD}?</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referrer_name" className="block text-sm text-[#8CA3BF] mb-2">
                        Your name
                      </label>
                      <input
                        id="referrer_name"
                        name="referrer_name"
                        value={form.referrer_name}
                        onChange={handleChange}
                        className={field}
                      />
                    </div>
                    <div>
                      <label htmlFor="referrer_email" className="block text-sm text-[#8CA3BF] mb-2">
                        Your email
                      </label>
                      <input
                        id="referrer_email"
                        name="referrer_email"
                        type="email"
                        required
                        value={form.referrer_email}
                        onChange={handleChange}
                        className={field}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[#5B7A9E]">
                    Use the address your course is under, so we can match it up.
                  </p>
                </fieldset>

                <div>
                  <label htmlFor="note" className="block text-sm text-[#8CA3BF] mb-2">
                    Anything we should know? <span className="text-[#5B7A9E]">(optional)</span>
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={3}
                    value={form.note}
                    onChange={handleChange}
                    placeholder="How you know them, what they've said about getting into PT…"
                    className={field}
                  />
                </div>

                {error && <p className="text-[#FF8A8A] text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="bg-[#F5C518] text-[#072B4A] font-bold px-8 py-4 rounded-full hover:brightness-95 transition disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send the referral"}
                </button>

                <p className="text-sm text-[#5B7A9E] pt-2">
                  Would rather just message us? WhatsApp{" "}
                  <a href={WHATSAPP_LINK} className="text-[#F5C518] underline">
                    {WHATSAPP_DISPLAY}
                  </a>
                  .
                </p>
              </form>
            )}

            <div className="mt-12 pt-8 border-t border-[#1E3A5C]">
              <h2 className="text-white font-semibold mb-3">How it works</h2>
              <ol className="text-[#8CA3BF] leading-relaxed space-y-2 list-decimal list-inside">
                <li>You tell us who to speak to.</li>
                <li>We get in touch with them — no pressure, no hard sell.</li>
                <li>If they enrol, we pay you {REWARD}.</li>
              </ol>
              <p className="text-sm text-[#5B7A9E] mt-4">
                We&apos;ll only contact them about becoming a personal trainer, and we&apos;ll tell them you
                suggested it.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
