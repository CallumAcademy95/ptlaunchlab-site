'use client';
import { useState, useEffect, use } from 'react';

interface AdWithInsights {
  id: string;
  name: string;
  status: string;
  adset_id: string;
  insights: {
    spend: number;
    ctr: number;
    cpc: number;
    cpl: number;
    leads: number;
    impressions: number;
    clicks: number;
  } | null;
  score: {
    score: number | null;
    label: string;
    reason: string;
  };
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  daily_budget: string;
  ads: AdWithInsights[];
}

const scoreColour = (s: string) =>
  s === 'good' ? '#22c55e' : s === 'ok' ? '#F5C518' : s === 'poor' ? '#ef4444' : '#6b7280';

export default function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const [adsets, setAdsets] = useState<AdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta-ads/campaigns/${campaignId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAdsets(data.adsets ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(type: 'adset' | 'ad', id: string, current: string) {
    setToggling(id);
    const newStatus = current === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await fetch(`/api/meta-ads/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, status: newStatus }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <a href="/admin/ads" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Campaign Detail</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}>Loading...</div>
      ) : adsets.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}>No ad sets found.</div>
      ) : (
        adsets.map((adset) => (
          <div key={adset.id} style={{ background: '#0D3559', borderRadius: '12px', padding: '24px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Ad Set header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{adset.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  Budget: £{(parseInt(adset.daily_budget ?? '0', 10) / 100).toFixed(2)}/day
                </div>
              </div>
              <button
                onClick={() => toggle('adset', adset.id, adset.status)}
                disabled={toggling === adset.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  background: adset.status === 'ACTIVE' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                  color: adset.status === 'ACTIVE' ? '#ef4444' : '#22c55e',
                  opacity: toggling === adset.id ? 0.6 : 1,
                }}
              >
                {adset.status === 'ACTIVE' ? 'Pause Ad Set' : 'Activate Ad Set'}
              </button>
            </div>

            {/* Ads */}
            {adset.ads.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No ads in this ad set.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                    {['Ad Name', 'Status', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Spend', 'Leads', 'CPL', 'Score', 'Action'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adset.ads.map((ad) => (
                    <tr key={ad.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '10px' }}>{ad.name}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: ad.status === 'ACTIVE' ? '#22c55e' : '#9ca3af', fontSize: '12px' }}>{ad.status}</span>
                      </td>
                      <td style={{ padding: '10px' }}>{ad.insights?.impressions?.toLocaleString() ?? '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights?.clicks ?? '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights ? `${ad.insights.ctr.toFixed(2)}%` : '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights ? `£${ad.insights.cpc.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights ? `£${ad.insights.spend.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights?.leads ?? '—'}</td>
                      <td style={{ padding: '10px' }}>{ad.insights && ad.insights.cpl > 0 ? `£${ad.insights.cpl.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: scoreColour(ad.score.label), fontWeight: 600 }} title={ad.score.reason}>
                          {ad.score.label === 'insufficient' ? '—' : ad.score.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button
                          onClick={() => toggle('ad', ad.id, ad.status)}
                          disabled={toggling === ad.id}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: ad.status === 'ACTIVE' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                            color: ad.status === 'ACTIVE' ? '#ef4444' : '#22c55e',
                            opacity: toggling === ad.id ? 0.6 : 1,
                          }}
                        >
                          {ad.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </button>
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
