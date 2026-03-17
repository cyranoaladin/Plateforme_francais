import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, LucideIcon } from 'lucide-react';

type NoticeVariant = 'info' | 'success' | 'warning' | 'error' | 'loading' | 'empty';

type StateNoticeProps = {
  title: string;
  description?: string;
  variant?: NoticeVariant;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  center?: boolean;
};

const VARIANT_STYLES: Record<NoticeVariant, { shell: string; iconBox: string; text: string; defaultIcon: LucideIcon }> = {
  info: {
    shell: 'border-[var(--border-light)] bg-[var(--info-bg)]',
    iconBox: 'bg-[var(--navy)]/10 text-[var(--navy)]',
    text: 'text-[var(--navy-mid)]',
    defaultIcon: Info,
  },
  success: {
    shell: 'border-[var(--border-success)] bg-[var(--success-bg)]',
    iconBox: 'bg-[var(--teal)]/10 text-[var(--teal)]',
    text: 'text-[var(--navy-mid)]',
    defaultIcon: CheckCircle2,
  },
  warning: {
    shell: 'border-[var(--surface-sand)] bg-[var(--warning-bg)]',
    iconBox: 'bg-[var(--gold-deep)]/10 text-[var(--gold-deep)]',
    text: 'text-[var(--gold-contrast)]',
    defaultIcon: AlertTriangle,
  },
  error: {
    shell: 'border-[var(--error-border)] bg-[var(--error-bg)]',
    iconBox: 'bg-[var(--error-text)]/10 text-[var(--error-text)]',
    text: 'text-[var(--gold-contrast)]',
    defaultIcon: AlertTriangle,
  },
  loading: {
    shell: 'border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-ivory)_0%,var(--surface-warm)_100%)]',
    iconBox: 'bg-[var(--navy)]/10 text-[var(--navy)]',
    text: 'text-[var(--navy-muted)]',
    defaultIcon: Loader2,
  },
  empty: {
    shell: 'border-dashed border-[var(--border-strong)] bg-[var(--surface-warm)]',
    iconBox: 'bg-[var(--accent-bronze)]/10 text-[var(--accent-bronze)]',
    text: 'text-[var(--text-secondary)]',
    defaultIcon: Info,
  },
};

export function StateNotice({
  title,
  description,
  variant = 'info',
  icon,
  action,
  className = '',
  center = false,
}: StateNoticeProps) {
  const visual = VARIANT_STYLES[variant];
  const Icon = icon ?? visual.defaultIcon;

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[var(--shadow-sm)] ${visual.shell} ${className}`}
    >
      <div className={`flex gap-4 ${center ? 'flex-col items-center text-center' : 'items-start'}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.iconBox}`}>
          <Icon className={`h-5 w-5 ${variant === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className={`min-w-0 flex-1 ${visual.text}`}>
          <h3 className="text-base font-semibold text-[var(--navy)]">{title}</h3>
          {description ? <p className="mt-1.5 text-sm leading-7">{description}</p> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
