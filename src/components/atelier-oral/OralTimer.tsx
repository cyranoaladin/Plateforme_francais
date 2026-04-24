import { Clock, Zap } from '@/components/ui/icons';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function timerTone(remaining: number): string {
  if (remaining <= 120) return 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]';
  if (remaining <= 600) return 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--c-reward)]';
  return 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)]';
}

type OralTimerProps = {
  remaining: number;
  label: string;
  mode: 'simulation' | 'free';
  variant?: 'full' | 'compact';
};

export function OralTimer({
  remaining,
  label,
  mode,
  variant = 'full',
}: OralTimerProps) {
  if (mode === 'free') {
    return (
      <span className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)]">
        <Zap className="h-4 w-4" />
        Mode libre
      </span>
    );
  }

  const sizeClasses = variant === 'compact'
    ? 'px-3 py-2 text-xs'
    : 'px-4 py-3 font-mono text-lg font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[var(--radius-lg)] border ${sizeClasses} ${timerTone(remaining)}`}
      role="timer"
      aria-live="polite"
      aria-label={`${label} : ${formatTimer(remaining)}`}
    >
      <Clock className={variant === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
      {formatTimer(remaining)}
    </span>
  );
}
