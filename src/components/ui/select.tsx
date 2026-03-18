'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const sizeStyles = {
  sm: 'h-8 text-sm px-3 pr-8',
  md: 'h-10 text-sm px-4 pr-9',
  lg: 'h-12 text-base px-5 pr-10',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectSize = keyof typeof sizeStyles;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label displayed above the select. */
  label?: string;
  /** Error message — activates the error visual state. */
  error?: string;
  /** Hint text displayed below the select. */
  hint?: string;
  /** Array of options to render. */
  options: SelectOption[];
  /** Placeholder text shown as the first disabled option. */
  placeholder?: string;
  /** Size preset. */
  size?: SelectSize;
}

/**
 * Styled select dropdown for the Nexus Reussite EAF platform.
 *
 * Renders a native `<select>` element with consistent styling, a custom
 * chevron icon, label, error/hint messaging, and three sizes.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      size = 'md',
      className,
      id,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const autoId = React.useId();
    const selectId = id ?? autoId;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--text-body)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-[var(--radius-md)] bg-[var(--surface-paper)] border transition-all duration-[var(--transition-base)]',
              'focus:outline-none focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              error
                ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20'
                : 'border-[var(--border-strong)]',
              sizeStyles[size],
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${selectId}-error`
                : hint
                  ? `${selectId}-hint`
                  : undefined
            }
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
            aria-hidden
          />
        </div>

        {error && (
          <p id={`${selectId}-error`} className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="text-sm text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
