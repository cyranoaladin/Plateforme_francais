import * as React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------

const variantStyles = {
  default:
    'bg-[var(--bg-surface-secondary)] text-[var(--text-body)] border border-[var(--border-default)]',
  success:
    'bg-[var(--bg-success)] text-[var(--c-success)] border border-[var(--c-success)]/20',
  warning:
    'bg-[var(--bg-reward)] text-[var(--c-reward)] border border-[var(--c-reward)]/20',
  error:
    'bg-[var(--c-accent-subtle)] text-[var(--c-accent)] border border-[var(--c-accent)]/20',
  info:
    'bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]/20',
  premium:
    'bg-gradient-to-r from-[var(--c-reward)]/10 to-[var(--color-amber-300)]/10 text-[var(--text-reward-on-subtle)] border border-[var(--c-reward)]/30',
  navy:
    'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
  outline:
    'bg-[var(--bg-surface)] text-[var(--text-body)] border border-[var(--border-default)]',
} as const;

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant = keyof typeof variantStyles;
export type BadgeSize = keyof typeof sizeStyles;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant. */
  variant?: BadgeVariant;
  /** Size preset. */
  size?: BadgeSize;
}

/**
 * Inline badge / tag for the Nexus Réussite EAF platform.
 *
 * Seven variants cover status colours (success, warning, error, info),
 * the default neutral cream, a premium gold gradient, and a solid navy.
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className, children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'rounded-full font-medium inline-flex items-center gap-1',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
