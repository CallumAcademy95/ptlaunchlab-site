'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AdData {
  adId: string;
  adName: string;
  status: string;
  spend: number;
  ctr: number;
  cpc: number;
  cpl: number;
  leads: number;
  score: string;
  scoreReason: string;
}

interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  health: string;
  adCount: number;
  ads: AdData[];
}

interface Summary {
  totalSpend: number;
  totalLeads: number;
  blendedCPL: number;
  blendedCTR: number;
  blendedCPC: number;
  datePreset: string;
}

interface OptAction {
  action: string;
  ad_id?: string;
  adset_id?: string;
  new_headline?: string;
  new_body?: string;
  reason: string;
  executed: boolean;
  pendingApproval?: boolean;
}

const healthColour = (h: string) =>
  h === 'good' ? '#15803d' : h === 'ok' ? '#1d4ed8' : '#dc2626';

const scoreColour = (s: string) =>
  s === 'good' ? '#15803d' : s === 'ok' ? '#1d4ed8' : s === 'poor' ? '#dc2626' : '#475569';

export default function AdsAdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimising, setOptimising] = useState(false);
  const [optResults, setOptResults] = useState<OptAction[]>([]);
  const [datePreset, setDatePreset] = useState('last_7d');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/meta-ads/performance?datePreset=${datePreset}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setCampaigns(data.campaigns);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => { load(); }, [load]);

  async function runOptimisation() {
    setOptimising(true);
    setOptResults([]);
    try {
      const res = await fetch('/api/meta-ads/optimise', { method: 'POST' });
      const data = await res.json();
      setOptResults(data.actions ?? []);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOptimising(false);
    }
  }

  const pending = optResults.filter((a) => a.pendingApproval);
  const executed = optResults.filter((a) => a.executed);

  return (
    <div>
      {/* Header row */}
      {/* Wraps on a phone: title on its own line, then the controls. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
        <h1 className="m-0 text-[22px] font-bold md:text-2xl">Ad Performance</h1>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:gap-3">
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[16px] text-slate-900 md:h-auto md:w-auto md:py-2 md:text-[13px]"
          >
            <option value="last_7d">Last 7 days</option>
            <option value="last_14d">Last 14 days</option>
            <option value="last_30d">Last 30 days</option>
          </select>
          <button
            onClick={runOptimisation}
            disabled={optimising || loading}
            className="min-h-11 flex-1 cursor-pointer whitespace-nowrap rounded-lg border-none bg-blue-700 px-4 py-2.5 text-sm font-bold text-[#f6f8fb] md:min-h-0 md:flex-none md:px-5"
            style={{ opacity: optimising ? 0.7 : 1 }}
          >
            {optimising ? 'Optimising...' : '⚡ Run AI Optimisation'}
          </button>
          <Link
            href="/admin/ads/create"
            className="inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white no-underline md:min-h-0 md:flex-none md:px-5"
          >
            + Create Campaign
          </Link>
        </div>
      </div>

      {error && (
        <div className="[overflow-wrap:anywhere]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #dc2626', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {[
            { label: 'Total Spend', value: `£${summary.totalSpend.toFixed(2)}` },
            { label: 'Total Leads', value: summary.totalLeads },
            { label: 'Blended CPL', value: `£${summary.blendedCPL.toFixed(2)}` },
            { label: 'Blended CTR', value: `${summary.blendedCTR.toFixed(2)}%` },
            { label: 'Blended CPC', value: `£${summary.blendedCPC.toFixed(2)}` },
          ].map((card) => (
            <div key={card.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 md:p-5">
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div className="text-xl font-bold md:text-2xl">{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Optimisation results */}
      {executed.length > 0 && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#15803d', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions Executed</h3>
          {executed.map((a, i) => (
            <div key={i} style={{ fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
              ✓ <strong>{a.action}</strong> — {a.reason}
            </div>
          ))}
        </div>
      )}

      {/* Pending copy rewrites */}
      {pending.length > 0 && (
        <div style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1d4ed8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copy Rewrites — Pending Your Approval</h3>
          {pending.map((a, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Ad: {a.ad_id}</div>
              <div style={{ marginBottom: '4px' }}><strong>Headline:</strong> {a.new_headline}</div>
              <div style={{ marginBottom: '4px' }}><strong>Body:</strong> {a.new_body}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>{a.reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="px-4 py-12 text-center text-slate-500 md:p-[60px]">
          No campaigns yet. <Link href="/admin/ads/create" style={{ color: '#1d4ed8' }}>Create your first one →</Link>
        </div>
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} className="mb-4 min-w-0 rounded-xl border border-slate-200 bg-white p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
                <span style={{ fontSize: '18px', fontWeight: 600 }}>{campaign.name}</span>
                <span style={{ background: campaign.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.2)', color: campaign.status === 'ACTIVE' ? '#15803d' : '#64748b', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {campaign.status}
                </span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: healthColour(campaign.health), display: 'inline-block' }} title={`Health: ${campaign.health}`} />
              </div>
              <Link href={`/admin/ads/${campaign.id}`} style={{ color: '#1d4ed8', fontSize: '13px', textDecoration: 'none' }}>View detail →</Link>
            </div>

            {/* Ads table */}
            {campaign.ads.length > 0 && (
              // Eight columns: scroll sideways inside the card on a phone
              // rather than squeezing every figure into a sliver.
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <table className="min-w-[40rem] md:min-w-0" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#64748b', textAlign: 'left' }}>
                    {['Ad', 'Status', 'Spend', 'CTR', 'CPC', 'CPL', 'Leads', 'Score'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaign.ads.map((ad) => (
                    <tr key={ad.adId} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>{ad.adName}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: ad.status === 'ACTIVE' ? '#15803d' : '#64748b', fontSize: '12px' }}>{ad.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>£{ad.spend?.toFixed(2) ?? '0.00'}</td>
                      <td style={{ padding: '10px 12px' }}>{ad.ctr?.toFixed(2) ?? '0'}%</td>
                      <td style={{ padding: '10px 12px' }}>£{ad.cpc?.toFixed(2) ?? '0.00'}</td>
                      <td style={{ padding: '10px 12px' }}>{ad.cpl > 0 ? `£${ad.cpl.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{ad.leads ?? 0}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: scoreColour(ad.score), fontWeight: 600 }} title={ad.scoreReason}>
                          {ad.score === 'insufficient' ? '—' : ad.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
