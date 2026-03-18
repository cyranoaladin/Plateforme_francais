'use client';

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const sizeStyles = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-5',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputSize = keyof typeof sizeStyles;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label displayed above the input. */
  label?: string;
  /** Error message — activates the error visual state. */
  error?: string;
  /** Hint text displayed below the input. */
  hint?: string;
  /** Icon rendered inside the left side of the input. */
  icon?: React.ReactNode;
  /** Size preset. */
  size?: InputSize;
}

/**
 * Styled text input for the Nexus Reussite EAF platform.
 *
 * Supports label, error/hint messaging, optional leading icon, and three
 * sizes. Uses `forwardRef` for seamless integration with form libraries.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      size = 'md',
      className,
      id,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-body)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-[var(--radius-md)] bg-[var(--surface-paper)] border transition-all duration-[var(--transition-base)]',
              'placeholder:text-[var(--text-placeholder)]',
              'focus:outline-none focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20'
                : 'border-[var(--border-strong)]',
              sizeStyles[size],
              icon && 'pl-10',
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                  ? `${inputId}-hint`
                  : undefined
            }
            {...rest}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-sm text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
