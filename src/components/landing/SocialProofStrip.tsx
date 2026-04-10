'use client';

export function SocialProofStrip() {
  return (
    <div
      className="flex items-center justify-center gap-2"
      style={{
        background: 'var(--eaf-bg1)',
        borderTop: '1px solid var(--eaf-border)',
        borderBottom: '1px solid var(--eaf-border)',
        padding: '20px 2rem',
      }}
    >
      <div
        className="flex items-center gap-1"
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      >
        {'★★★★★'.split('').map((star, i) => (
          <span key={i} style={{ color: 'var(--eaf-gold)', fontSize: '16px' }}>
            {star}
          </span>
        ))}
        <span
          className="font-semibold ml-2"
          style={{ fontSize: '14px', color: 'var(--eaf-text-primary)' }}
        >
          98 %
        </span>
        <span style={{ fontSize: '14px', color: 'var(--eaf-text-secondary)' }}>
          de mention AB ou plus
        </span>
        <span
          style={{
            width: '4px',
            height: '4px',
            background: 'var(--eaf-text-tertiary)',
            borderRadius: '50%',
            margin: '0 4px',
          }}
        />
        <span style={{ fontSize: '14px', color: 'var(--eaf-text-tertiary)' }}>
          Session 2025 · Élèves Premium actifs (n=47)
        </span>
      </div>
    </div>
  );
}
