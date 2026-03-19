'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    dailyBudget: '10',
    destination: 'quiz' as 'quiz' | 'funnel',
    headline: '',
    primaryText: '',
    imageUrl: '',
    ctaType: 'LEARN_MORE' as 'LEARN_MORE' | 'SIGN_UP',
    activateImmediately: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/meta-ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          dailyBudgetPence: Math.round(parseFloat(form.dailyBudget) * 100),
          destination: form.destination,
          headline: form.headline,
          primaryText: form.primaryText,
          imageUrl: form.imageUrl,
          ctaType: form.ctaType,
          activateImmediately: form.activateImmediately,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(`/admin/ads/${data.campaignId}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0D3559',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '6px',
    fontWeight: 500,
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <a href="/admin/ads" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Create Campaign</h1>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {['Basics', 'Creative', 'Launch'].map((label, i) => (
          <div
            key={label}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              background: step === i + 1 ? '#F5C518' : step > i + 1 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
              color: step === i + 1 ? '#061F36' : step > i + 1 ? '#22c55e' : 'rgba(255,255,255,0.4)',
            }}
          >
            {step > i + 1 ? '✓ ' : ''}{label}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Campaign Name</label>
            <input style={inputStyle} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. PTL — UK Lead Gen — Quiz — Mar 2026" />
          </div>
          <div>
            <label style={labelStyle}>Daily Budget (£)</label>
            <input style={inputStyle} type="number" min="1" step="1" value={form.dailyBudget} onChange={(e) => update('dailyBudget', e.target.value)} />
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Minimum recommended: £10/day</div>
          </div>
          <div>
            <label style={labelStyle}>Destination</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'quiz', label: 'Quiz (/quiz)', desc: 'Best for cold audiences' },
                { value: 'funnel', label: 'Funnel (/funnel)', desc: 'Warmer audiences' },
              ].map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => update('destination', opt.value)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '8px',
                    border: `2px solid ${form.destination === opt.value ? '#F5C518' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    background: form.destination === opt.value ? 'rgba(245,197,24,0.08)' : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!form.name || !form.dailyBudget}
            style={{ background: '#F5C518', color: '#061F36', fontWeight: 700, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: !form.name ? 0.5 : 1 }}
          >
            Next: Ad Creative →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>
              Headline <span style={{ color: form.headline.length > 40 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>({form.headline.length}/40)</span>
            </label>
            <input style={inputStyle} value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="e.g. What Type of PT Should You Be?" maxLength={40} />
          </div>
          <div>
            <label style={labelStyle}>
              Primary Text <span style={{ color: form.primaryText.length > 125 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>({form.primaryText.length}/125)</span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              value={form.primaryText}
              onChange={(e) => update('primaryText', e.target.value)}
              placeholder="e.g. Thinking about becoming a PT? Find out which path suits you in under 2 minutes."
              maxLength={125}
            />
          </div>
          <div>
            <label style={labelStyle}>Image URL</label>
            <input style={inputStyle} value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://ptlaunchlab.co.uk/..." />
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Must be publicly accessible. Recommended: 1200×628px</div>
          </div>
          <div>
            <label style={labelStyle}>Call to Action</label>
            <select style={inputStyle} value={form.ctaType} onChange={(e) => update('ctaType', e.target.value)}>
              <option value="LEARN_MORE">Learn More</option>
              <option value="SIGN_UP">Sign Up</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.headline || !form.primaryText || !form.imageUrl}
              style={{ flex: 2, background: '#F5C518', color: '#061F36', fontWeight: 700, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: (!form.headline || !form.primaryText || !form.imageUrl) ? 0.5 : 1 }}
            >
              Next: Review & Launch →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#0D3559', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review</h3>
            {[
              ['Campaign', form.name],
              ['Daily Budget', `£${form.dailyBudget}/day`],
              ['Destination', `/${form.destination}`],
              ['Headline', form.headline],
              ['Body', form.primaryText],
              ['CTA', form.ctaType],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                <span style={{ maxWidth: '300px', textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>

          <div
            onClick={() => update('activateImmediately', !form.activateImmediately)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '14px', borderRadius: '8px', border: `2px solid ${form.activateImmediately ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, background: form.activateImmediately ? 'rgba(34,197,94,0.08)' : 'transparent' }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${form.activateImmediately ? '#22c55e' : 'rgba(255,255,255,0.3)'}`, background: form.activateImmediately ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.activateImmediately && <span style={{ color: '#061F36', fontWeight: 700, fontSize: '13px' }}>✓</span>}
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>Activate immediately</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Leave unchecked to create as Paused (recommended for review)</div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 16px', color: '#ef4444', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>← Back</button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{ flex: 2, background: '#F5C518', color: '#061F36', fontWeight: 700, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Creating...' : form.activateImmediately ? '🚀 Create & Activate' : 'Create Campaign (Paused)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
