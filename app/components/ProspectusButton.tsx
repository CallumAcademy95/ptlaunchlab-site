"use client";
import { useState } from "react";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";

export default function ProspectusButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sec = useFormSecurity();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/prospectus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setOpen(false);
      setForm({ name: "", phone: "", email: "" });
      trackEvent('prospectus_download');
      // Clear the once-flag so the thank-you page will open the PDF
      try { sessionStorage.removeItem('ptll_prospectus_opened'); } catch {}
      window.location.href = "/prospectus/thank-you";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* CTA card */}
      <div className="mt-12 bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-white font-bold text-lg mb-1">Want the full course breakdown?</p>
          <p className="text-[#8CA3BF] text-sm">Download the course prospectus — all 12 modules, assessment details, and what to expect at every stage.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 px-7 py-3 rounded-full border border-[#F5C518] text-[#F5C518] font-bold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all whitespace-nowrap"
        >
          Download Prospectus →
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#0D3559] border border-[#3B82F6]/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Get the Course Prospectus</h3>
                <p className="text-[#8CA3BF] text-sm">Enter your details and we&apos;ll open the PDF instantly.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#4A6280] hover:text-white transition-colors text-2xl leading-none ml-4">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <sec.Honeypot />
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 text-sm"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-[#072B4A] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518]/50 text-sm"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all disabled:opacity-60"
              >
                {loading ? "Sending…" : "Download Prospectus →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
