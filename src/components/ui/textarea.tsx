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
  sm: 'text-sm px-3 py-2',
  md: 'text-sm px-4 py-3',
  lg: 'text-base px-5 py-4',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextareaSize = keyof typeof sizeStyles;

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Label displayed above the textarea. */
  label?: string;
  /** Error message — activates the error visual state. */
  error?: string;
  /** Hint text displayed below the textarea. */
  hint?: string;
  /** Icon rendered inside the top-left of the textarea wrapper. */
  icon?: React.ReactNode;
  /** Size preset. */
  size?: TextareaSize;
  /** Number of visible text rows. Defaults to 4. */
  rows?: number;
}

/**
 * Styled textarea for the Nexus Réussite EAF platform.
 *
 * Mirrors the Input component API: label, error/hint messaging, optional icon,
 * three sizes, and `forwardRef` support.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      size = 'md',
      rows = 4,
      className,
      id,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const autoId = React.useId();
    const textareaId = id ?? autoId;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--text-body)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute top-3 left-3 text-[var(--text-muted)]">
              {icon}
            </span>
          )}

          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            disabled={disabled}
            className={cn(
              'w-full rounded-[var(--radius-md)] bg-[var(--surface-paper)] border transition-all duration-[var(--transition-base)] resize-y',
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
                ? `${textareaId}-error`
                : hint
                  ? `${textareaId}-hint`
                  : undefined
            }
            {...rest}
          />
        </div>

        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${textareaId}-hint`} className="text-sm text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
