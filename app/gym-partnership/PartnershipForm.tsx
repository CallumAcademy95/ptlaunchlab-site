"use client";
import { useState } from "react";
import { useFormSecurity } from "@/app/lib/security/client";

export default function PartnershipForm() {
  const [form, setForm] = useState({
    gymName: "", name: "", email: "", phone: "", location: "", gymSize: "", referredBy: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const sec = useFormSecurity();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/gym-partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[#F5C518]/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Application Received</h3>
        <p className="text-[#8CA3BF] max-w-sm mx-auto text-sm">
          We&apos;ll review your application and be in touch within 24 hours to discuss your area.
        </p>
      </div>
    );
  }

  const inputClass = "w-full bg-[#061F36] border border-[#3B82F6]/25 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <sec.Honeypot />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Gym Name <span className="text-[#F5C518]">*</span>
          </label>
          <input name="gymName" value={form.gymName} onChange={handleChange} required placeholder="e.g. Iron Wolf Gym" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Your Name <span className="text-[#F5C518]">*</span>
          </label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="First & last name" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Email <span className="text-[#F5C518]">*</span>
          </label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@yourgym.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Phone <span className="text-[#F5C518]">*</span>
          </label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="07700 000000" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Gym Location <span className="text-[#F5C518]">*</span>
          </label>
          <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Leeds, Yorkshire" className={inputClass} />
        </div>
        <div>
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Membership Size
          </label>
          <select name="gymSize" value={form.gymSize} onChange={handleChange} className={`${inputClass} appearance-none`}>
            <option value="">Select (optional)</option>
            <option value="Under 100">Under 100 members</option>
            <option value="100–300">100–300 members</option>
            <option value="300–600">300–600 members</option>
            <option value="600–1000">600–1,000 members</option>
            <option value="1000+">1,000+ members</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[#8CA3BF] text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
            Referred By
          </label>
          <input
            name="referredBy"
            value={form.referredBy}
            onChange={handleChange}
            placeholder="Gym or person who referred you (optional)"
            className={inputClass}
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm text-center">Something went wrong — please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Submitting…" : "Apply to Secure Your Area Now →"}
      </button>
      <p className="text-[#4A6280] text-xs text-center">One partner per area · Reviewed within 24 hours · No cost to apply</p>
    </form>
  );
}
