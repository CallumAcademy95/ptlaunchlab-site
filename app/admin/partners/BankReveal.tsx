"use client";

import { useState } from "react";
import { revealBankDetails } from "./actions";

/**
 * Masked by default, fetched on demand. The full number is never in the page
 * source — only in the response to an explicit click.
 */
export default function BankReveal({
  partnerId,
  masked,
  changedRecently,
}: {
  partnerId: string;
  masked: string | null;
  changedRecently: boolean;
}) {
  const [full, setFull] = useState<{ accountName: string | null; sortCode: string | null; accountNumber: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!masked) return <span className="text-soft text-xs">Not provided</span>;

  return (
    <div className="text-xs">
      {full ? (
        <div className="font-mono text-white">
          <div>{full.accountName}</div>
          <div>{full.sortCode} · {full.accountNumber}</div>
          <button
            type="button"
            onClick={() => setFull(null)}
            className="mt-1 text-soft font-sans hover:text-white"
          >
            Hide
          </button>
        </div>
      ) : (
        <div>
          <span className="text-soft font-mono">{masked}</span>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setFull(await revealBankDetails(partnerId));
              setLoading(false);
            }}
            className="ml-2 text-gold hover:underline disabled:opacity-60"
          >
            {loading ? "…" : "Reveal"}
          </button>
        </div>
      )}

      {changedRecently && (
        <p className="text-amber-300 mt-1">
          Changed in the last 7 days — confirm before paying
        </p>
      )}
    </div>
  );
}
