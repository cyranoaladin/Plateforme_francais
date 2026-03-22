'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------

const variantStyles = {
  primary:
    'bg-[var(--navy)] text-white hover:bg-[var(--navy-dark)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]',
  secondary:
    'bg-[var(--card)] text-[var(--navy)] border border-[var(--navy)] hover:bg-[var(--surface-cream)]',
  ghost:
    'bg-transparent text-[var(--navy)] hover:bg-[var(--surface-cream)]',
  danger:
    'bg-[var(--error)] text-white hover:brightness-90',
  gold:
    'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-muted)] text-[var(--gold-contrast)] font-semibold hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[var(--shadow-gold)]',
  teal:
    'bg-[var(--teal)] text-white hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. */
  variant?: ButtonVariant;
  /** Size preset. */
  size?: ButtonSize;
  /** Show a loading spinner and disable the button. */
  loading?: boolean;
  /** Optional icon element. */
  icon?: React.ReactNode;
  /** Side of the button the icon appears on. */
  iconPosition?: 'left' | 'right';
  /** Stretch to fill container width. */
  fullWidth?: boolean;
}

/**
 * Premium button component for the Nexus Réussite EAF platform.
 *
 * Supports five visual variants (`primary`, `secondary`, `ghost`, `danger`,
 * `gold`) and three sizes. Handles loading state with an animated spinner.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium',
          'transition-all duration-[var(--transition-base)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]',
          'disabled:opacity-50 disabled:pointer-events-none',
          // Variant & size
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
