import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, LucideIcon } from 'lucide-react';

type NoticeVariant = 'info' | 'success' | 'warning' | 'error' | 'loading';

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
    shell: 'border-[#d9e6f0] bg-[#f4f8fb]',
    iconBox: 'bg-[#17324d]/10 text-[#17324d]',
    text: 'text-[#33536f]',
    defaultIcon: Info,
  },
  success: {
    shell: 'border-[#d6e8df] bg-[#edf7f3]',
    iconBox: 'bg-[#0f766e]/10 text-[#0f766e]',
    text: 'text-[#33536f]',
    defaultIcon: CheckCircle2,
  },
  warning: {
    shell: 'border-[#efd9b4] bg-[#fff7ea]',
    iconBox: 'bg-[#af7a20]/10 text-[#af7a20]',
    text: 'text-[#6b5735]',
    defaultIcon: AlertTriangle,
  },
  error: {
    shell: 'border-[#f1c8c0] bg-[#fff0ed]',
    iconBox: 'bg-[#b24838]/10 text-[#b24838]',
    text: 'text-[#6a4a46]',
    defaultIcon: AlertTriangle,
  },
  loading: {
    shell: 'border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)]',
    iconBox: 'bg-[#17324d]/10 text-[#17324d]',
    text: 'text-[#5d7287]',
    defaultIcon: Loader2,
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
      className={`rounded-[28px] border p-5 shadow-[0_14px_40px_rgba(23,50,77,0.05)] ${visual.shell} ${className}`}
    >
      <div className={`flex gap-4 ${center ? 'flex-col items-center text-center' : 'items-start'}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.iconBox}`}>
          <Icon className={`h-5 w-5 ${variant === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className={`min-w-0 flex-1 ${visual.text}`}>
          <h3 className="text-base font-semibold text-[#17324d]">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-7">{description}</p> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
