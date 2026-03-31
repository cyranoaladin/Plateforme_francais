import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Variant & padding maps
// ---------------------------------------------------------------------------

const variantStyles = {
  default:
    'bg-[var(--bg-surface)] text-[var(--text-heading)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]',
  elevated:
    'bg-[var(--bg-surface)] text-[var(--text-heading)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--transition-normal)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
  outlined:
    'bg-transparent border-2 border-[var(--border-default)] rounded-[var(--radius-lg)]',
  dark:
    'border border-[var(--hero-surface-border)] bg-[var(--hero-surface-base)] bg-[image:var(--hero-surface-bg)] text-[var(--hero-surface-text)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]',
  premium:
    'bg-[var(--bg-surface)] text-[var(--text-heading)] border-2 border-[var(--c-reward)]/30 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]',
  subtle:
    'bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] border border-[var(--border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]',
  glass:
    'bg-[var(--hero-glass-bg)] text-[var(--hero-glass-text)] border border-[var(--hero-glass-border)] rounded-[var(--radius-lg)] backdrop-blur-md shadow-[var(--shadow-md)]',
} as const;

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  none: 'p-0',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardVariant = keyof typeof variantStyles;
export type CardPadding = keyof typeof paddingStyles;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant. */
  variant?: CardVariant;
  /** Padding preset. */
  padding?: CardPadding;
  /** Enable subtle hover lift micro-interaction. */
  hoverable?: boolean;
}

/**
 * Versatile card container for the Nexus Réussite EAF platform.
 *
 * Five variants cover common surface needs: default resting cards, elevated
 * hover-lift cards, outlined containers, dark contrast panels, and premium
 * gold-accented surfaces.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && 'transition-all duration-[var(--transition-normal)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card };
