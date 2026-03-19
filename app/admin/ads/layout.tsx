export default function AdsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061F36', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#F5C518', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PT Launch Lab</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Ads Admin</span>
        </div>
        <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Back to site</a>
      </div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {children}
      </div>
    </div>
  );
}
