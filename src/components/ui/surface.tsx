import * as React from 'react';
import { cn } from '@/lib/utils';

const toneStyles = {
  default:
    'border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]',
  subtle:
    'border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] shadow-[var(--shadow-sm)]',
  primary:
    'border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-sm)]',
  success:
    'border border-[var(--border-success)] bg-[var(--bg-success)] shadow-[var(--shadow-sm)]',
  reward:
    'border border-[var(--border-reward)] bg-[var(--bg-reward)] shadow-[var(--shadow-sm)]',
  accent:
    'border border-[var(--border-accent)] bg-[var(--c-accent-subtle)] shadow-[var(--shadow-sm)]',
  glass:
    'border border-[var(--hero-glass-border)] bg-[var(--hero-glass-bg)] text-[var(--hero-glass-text)] backdrop-blur-md shadow-[var(--shadow-md)]',
  hero:
    'border border-[var(--hero-glass-border-strong)] bg-[var(--hero-glass-bg-strong)] text-[var(--hero-glass-text)] backdrop-blur-md shadow-[var(--shadow-md)]',
} as const;

const paddingStyles = {
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-7',
  none: 'p-0',
} as const;

export type SurfaceTone = keyof typeof toneStyles;
export type SurfacePadding = keyof typeof paddingStyles;

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  padding?: SurfacePadding;
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ tone = 'default', padding = 'md', className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[24px] transition-colors duration-[var(--transition-normal)]',
        toneStyles[tone],
        paddingStyles[padding],
        className,
      )}
      {...rest}
    />
  ),
);

Surface.displayName = 'Surface';

export { Surface };
