"use client";
import { useState } from "react";
import { trackEvent } from "@/app/lib/gtag";
import LeadForm from "@/app/components/LeadForm";

export default function ProspectusButton() {
  const [open, setOpen] = useState(false);

  // Lead already saved and Pixel Lead fired by submitLead; keep analytics + the prospectus redirect.
  function handleSuccess() {
    trackEvent('prospectus_download');
    // Clear the once-flag so the thank-you page will open the PDF
    try { sessionStorage.removeItem('ptll_prospectus_opened'); } catch {}
    window.location.href = "/prospectus/thank-you";
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
            <LeadForm
              intent="prospectus"
              source="prospectus_button"
              tone="dark"
              submitLabel="Download Prospectus →"
              successMessage="Thanks, opening the prospectus…"
              footnote="We'll also send you useful emails about the course and becoming a PT. Unsubscribe any time."
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}
