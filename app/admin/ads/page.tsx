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
  h === 'good' ? '#22c55e' : h === 'ok' ? '#F5C518' : '#ef4444';

const scoreColour = (s: string) =>
  s === 'good' ? '#22c55e' : s === 'ok' ? '#F5C518' : s === 'poor' ? '#ef4444' : '#6b7280';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Ad Performance</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            style={{ background: '#0D3559', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="last_7d">Last 7 days</option>
            <option value="last_14d">Last 14 days</option>
            <option value="last_30d">Last 30 days</option>
          </select>
          <button
            onClick={runOptimisation}
            disabled={optimising || loading}
            style={{ background: '#F5C518', color: '#061F36', fontWeight: 700, padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: optimising ? 0.7 : 1 }}
          >
            {optimising ? 'Optimising...' : '⚡ Run AI Optimisation'}
          </button>
          <Link
            href="/admin/ads/create"
            style={{ background: '#0E5FA0', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}
          >
            + Create Campaign
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Spend', value: `£${summary.totalSpend.toFixed(2)}` },
            { label: 'Total Leads', value: summary.totalLeads },
            { label: 'Blended CPL', value: `£${summary.blendedCPL.toFixed(2)}` },
            { label: 'Blended CTR', value: `${summary.blendedCTR.toFixed(2)}%` },
            { label: 'Blended CPC', value: `£${summary.blendedCPC.toFixed(2)}` },
          ].map((card) => (
            <div key={card.label} style={{ background: '#0D3559', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Optimisation results */}
      {executed.length > 0 && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#22c55e', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions Executed</h3>
          {executed.map((a, i) => (
            <div key={i} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              ✓ <strong>{a.action}</strong> — {a.reason}
            </div>
          ))}
        </div>
      )}

      {/* Pending copy rewrites */}
      {pending.length > 0 && (
        <div style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#F5C518', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copy Rewrites — Pending Your Approval</h3>
          {pending.map((a, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Ad: {a.ad_id}</div>
              <div style={{ marginBottom: '4px' }}><strong>Headline:</strong> {a.new_headline}</div>
              <div style={{ marginBottom: '4px' }}><strong>Body:</strong> {a.new_body}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>{a.reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
          No campaigns yet. <Link href="/admin/ads/create" style={{ color: '#F5C518' }}>Create your first one →</Link>
        </div>
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} style={{ background: '#0D3559', borderRadius: '12px', padding: '24px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>{campaign.name}</span>
                <span style={{ background: campaign.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.2)', color: campaign.status === 'ACTIVE' ? '#22c55e' : '#9ca3af', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {campaign.status}
                </span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: healthColour(campaign.health), display: 'inline-block' }} title={`Health: ${campaign.health}`} />
              </div>
              <Link href={`/admin/ads/${campaign.id}`} style={{ color: '#F5C518', fontSize: '13px', textDecoration: 'none' }}>View detail →</Link>
            </div>

            {/* Ads table */}
            {campaign.ads.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                    {['Ad', 'Status', 'Spend', 'CTR', 'CPC', 'CPL', 'Leads', 'Score'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaign.ads.map((ad) => (
                    <tr key={ad.adId} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '10px 12px' }}>{ad.adName}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: ad.status === 'ACTIVE' ? '#22c55e' : '#9ca3af', fontSize: '12px' }}>{ad.status}</span>
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
            )}
          </div>
        ))
      )}
    </div>
  );
}
