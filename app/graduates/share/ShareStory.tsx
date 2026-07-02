"use client";
import { useState } from "react";
import Link from "next/link";
import { useFormSecurity } from "@/app/lib/security/client";
import { AVATAR_LABELS, type Avatar } from "@/app/lib/graduates";

// ─────────────────────────────────────────────────────────────────────────────
// ShareStory — graduate story capture form (Proof Engine, WS3 #2).
// Submits to /api/graduate-story → Zapier → Sheet for curator review before an
// approved entry is added to the published graduates DB.
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_KEYS = Object.keys(AVATAR_LABELS) as Avatar[];

type Status = "idle" | "sending" | "done" | "error";

export default function ShareStory() {
  const sec = useFormSecurity();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    previousJob: "",
    region: "",
    specialism: "",
    avatar: "" as "" | Avatar,
    story: "",
    consent: false,
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const v = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.consent) {
      setError("Please tick the box to allow us to publish your story.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/graduate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          avatar: form.avatar || undefined,
          [sec.SEC_KEY]: sec.payload(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Something went wrong — please try again.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Network error — please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-card border border-gold/30 rounded-2xl p-8 text-center">
        <p className="text-gold font-display font-extrabold text-2xl mb-3">Thank you.</p>
        <p className="text-soft/80 text-[15px] leading-relaxed mb-6">
          Your story is in — we&apos;ll review it and, with your permission, feature you on our
          graduates page to help the next person take the leap.
        </p>
        <Link href="/graduates" className="text-gold text-sm font-semibold hover:underline">
          ← Back to graduates
        </Link>
      </div>
    );
  }

  const input =
    "w-full bg-base border border-white/[0.12] rounded-lg px-4 py-3 text-sm text-white placeholder:text-soft/40 focus:border-gold/50 outline-none";
  const label = "block text-soft/70 text-xs font-semibold uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={onSubmit} className="bg-card border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
      <sec.Honeypot />

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={label} htmlFor="gs-name">Your name *</label>
          <input id="gs-name" className={input} value={form.name} onChange={set("name")} required placeholder="Jane Smith" />
        </div>
        <div>
          <label className={label} htmlFor="gs-email">Email *</label>
          <input id="gs-email" type="email" className={input} value={form.email} onChange={set("email")} required placeholder="you@email.com" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={label} htmlFor="gs-phone">Phone (optional)</label>
          <input id="gs-phone" className={input} value={form.phone} onChange={set("phone")} placeholder="07…" />
        </div>
        <div>
          <label className={label} htmlFor="gs-avatar">Which best describes you?</label>
          <select id="gs-avatar" className={input} value={form.avatar} onChange={set("avatar")}>
            <option value="">Prefer not to say</option>
            {AVATAR_KEYS.map((a) => (
              <option key={a} value={a}>{AVATAR_LABELS[a]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={label} htmlFor="gs-job">What did you do before? (optional)</label>
          <input id="gs-job" className={input} value={form.previousJob} onChange={set("previousJob")} placeholder="e.g. Retail manager" />
        </div>
        <div>
          <label className={label} htmlFor="gs-region">Region (optional)</label>
          <input id="gs-region" className={input} value={form.region} onChange={set("region")} placeholder="e.g. Yorkshire" />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="gs-specialism">What do you focus on now? (optional)</label>
        <input id="gs-specialism" className={input} value={form.specialism} onChange={set("specialism")} placeholder="e.g. Online coaching, gym floor, women's strength" />
      </div>

      <div>
        <label className={label} htmlFor="gs-story">Your story *</label>
        <textarea
          id="gs-story"
          className={`${input} min-h-[140px] resize-y`}
          value={form.story}
          onChange={set("story")}
          required
          minLength={20}
          maxLength={2000}
          placeholder="Where were you before, why you made the change, and what life looks like now…"
        />
      </div>

      <label className="flex items-start gap-3 text-soft/75 text-[13px] leading-relaxed cursor-pointer">
        <input type="checkbox" checked={form.consent} onChange={set("consent")} className="mt-0.5 accent-gold w-4 h-4 shrink-0" />
        <span>I&apos;m happy for PT Launch Lab to publish my first name and story (and photo, if I share one) on the website and in marketing.</span>
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-gold text-base font-bold px-8 py-4 rounded-full hover:brightness-110 transition disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Share my story"}
      </button>
    </form>
  );
}
