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
  live?: 'assertive' | 'polite' | 'off';
};

const VARIANT_STYLES: Record<NoticeVariant, { shell: string; iconBox: string; text: string; defaultIcon: LucideIcon }> = {
  info: {
    shell: 'border-[var(--border-default)] bg-[var(--info-bg)]',
    iconBox: 'bg-[var(--c-primary)]/10 text-[var(--c-primary)]',
    text: 'text-[var(--text-body)]',
    defaultIcon: Info,
  },
  success: {
    shell: 'border-[var(--border-success)] bg-[var(--bg-success)]',
    iconBox: 'bg-[var(--c-success)]/10 text-[var(--c-success)]',
    text: 'text-[var(--text-body)]',
    defaultIcon: CheckCircle2,
  },
  warning: {
    shell: 'border-[var(--border-default)] bg-[var(--bg-reward)]',
    iconBox: 'bg-[var(--c-reward)]/10 text-[var(--c-reward)]',
    text: 'text-[var(--text-reward-on-subtle)]',
    defaultIcon: AlertTriangle,
  },
  error: {
    shell: 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)]',
    iconBox: 'bg-[var(--c-accent)]/12 text-[var(--c-accent-text)]',
    text: 'text-[var(--c-accent-text)]',
    defaultIcon: AlertTriangle,
  },
  loading: {
    shell: 'border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)]',
    iconBox: 'bg-[var(--c-primary)]/10 text-[var(--c-primary)]',
    text: 'text-[var(--text-secondary)]',
    defaultIcon: Loader2,
  },
  empty: {
    shell: 'border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]',
    iconBox: 'bg-[var(--c-reward)]/10 text-[var(--c-reward)]',
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
  live,
}: StateNoticeProps) {
  const visual = VARIANT_STYLES[variant];
  const Icon = icon ?? visual.defaultIcon;
  const ariaLive = live ?? (variant === 'error' || variant === 'warning' ? 'assertive' : 'polite');

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[var(--shadow-sm)] ${visual.shell} ${className}`}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      aria-live={ariaLive}
    >
      <div className={`flex gap-4 ${center ? 'flex-col items-center text-center' : 'items-start'}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.iconBox}`}>
          <Icon className={`h-5 w-5 ${variant === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className={`min-w-0 flex-1 ${visual.text}`}>
          <h3 className="text-base font-semibold text-[var(--text-heading)]">{title}</h3>
          {description ? <p className="mt-1.5 text-sm leading-7">{description}</p> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
