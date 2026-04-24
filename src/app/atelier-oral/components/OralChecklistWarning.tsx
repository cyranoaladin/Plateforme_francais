import { AlertTriangle } from '@/components/ui/icons';

type Props = {
  completed: number;
  total: number;
  descriptifCount?: number;
};

export function OralChecklistWarning({ completed, total, descriptifCount }: Props) {
  const showDescriptifEmpty = descriptifCount === 0;
  const showDescriptifIncomplete = descriptifCount !== undefined && descriptifCount > 0 && descriptifCount < 16;
  const showChecklistWarning = completed < total;

  if (!showDescriptifEmpty && !showDescriptifIncomplete && !showChecklistWarning) {
    return null;
  }

  return (
    <div className="space-y-2">
      {showDescriptifEmpty && (
        <div style={{
          background: 'rgba(255,107,53,0.08)',
          border: '1px solid rgba(255,107,53,0.30)',
          borderLeft: '4px solid var(--eaf-orange)',
          borderRadius: '0 12px 12px 0',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <AlertTriangle size={16} color="var(--eaf-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--eaf-orange)', marginBottom: '4px' }}>
              Ton descriptif de lecture est vide
            </div>
            <div style={{ fontSize: '12px', color: 'var(--eaf-text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
              La simulation va utiliser des textes du programme officiel au lieu de tes textes réels.
              L&apos;examinateur au vrai oral tirera dans{' '}
              <strong style={{ color: 'var(--eaf-text-primary)' }}>ton descriptif personnel</strong>.
            </div>
            <a
              href="/descriptif-lecture"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--eaf-orange)',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Déposer mes textes avant la simulation →
            </a>
          </div>
        </div>
      )}

      {showDescriptifIncomplete && (
        <div style={{
          background: 'rgba(255,181,71,0.06)',
          border: '1px solid rgba(255,181,71,0.25)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--eaf-text-secondary)',
        }}>
          ⚠️ Descriptif incomplet ({descriptifCount}/16 textes) — la simulation est partiellement personnalisée.{' '}
          <a href="/descriptif-lecture" style={{ color: 'var(--eaf-gold, #FFB547)', fontWeight: 600, textDecoration: 'none' }}>
            Compléter →
          </a>
        </div>
      )}

      {showChecklistWarning && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-reward)] bg-[var(--bg-reward)] px-4 py-3 text-sm text-[var(--text-reward-on-subtle)]">
          Checklist incomplète : termine tes repères de préparation avant de lancer le passage.
        </div>
      )}
    </div>
  );
}
