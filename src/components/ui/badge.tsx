import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------

const variantStyles = {
  default:
    'bg-[var(--surface-cream)] text-[var(--text-body)] border border-[var(--border-default)]',
  success:
    'bg-[var(--success-bg)] text-[var(--teal)] border border-[var(--teal)]/20',
  warning:
    'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/20',
  error:
    'bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]/20',
  info:
    'bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]/20',
  premium:
    'bg-gradient-to-r from-[var(--gold)]/10 to-[var(--gold-muted)]/10 text-[var(--gold-contrast)] border border-[var(--gold)]/30',
  navy:
    'bg-[var(--navy)] text-white',
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
 * Inline badge / tag for the Nexus Reussite EAF platform.
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
