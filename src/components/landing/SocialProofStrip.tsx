'use client';

export function SocialProofStrip() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        background: 'var(--eaf-bg1)',
        borderTop: '1px solid var(--eaf-border)',
        borderBottom: '1px solid var(--eaf-border)',
        padding: '14px 20px',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-center gap-1 gap-x-2"
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      >
        {'★★★★★'.split('').map((star, i) => (
          <span key={i} style={{ color: 'var(--eaf-gold)', fontSize: '14px' }}>
            {star}
          </span>
        ))}
        <span
          className="font-semibold ml-1"
          style={{ fontSize: '13px', color: 'var(--eaf-text-primary)' }}
        >
          98 %
        </span>
        <span style={{ fontSize: '13px', color: 'var(--eaf-text-secondary)' }}>
          de mention AB ou plus
        </span>
        <span
          className="hidden sm:inline-block"
          style={{
            width: '4px',
            height: '4px',
            background: 'var(--eaf-text-tertiary)',
            borderRadius: '50%',
            margin: '0 4px',
          }}
        />
        <span className="hidden sm:inline" style={{ fontSize: '13px', color: 'var(--eaf-text-tertiary)' }}>
          Session 2025 · Élèves Premium actifs (n=47)
        </span>
      </div>
    </div>
  );
}
