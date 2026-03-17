import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const titleSizeStyles = {
  sm: 'text-2xl',
  md: 'text-3xl md:text-4xl',
  lg: 'text-4xl md:text-5xl lg:text-6xl',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SectionHeaderSize = keyof typeof titleSizeStyles;

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title text. */
  title: string;
  /** Optional subtitle / description. */
  subtitle?: string;
  /** Horizontal alignment. */
  align?: 'left' | 'center';
  /** Title size preset. */
  size?: SectionHeaderSize;
}

/**
 * Editorial section header for the Nexus Reussite EAF platform.
 *
 * Uses the Playfair Display serif typeface for a scholarly, premium feel.
 * Supports left or center alignment and three size presets.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  align = 'left',
  size = 'md',
  className,
  ...rest
}) => {
  return (
    <div
      className={cn(
        align === 'center' && 'text-center',
        className,
      )}
      {...rest}
    >
      <h2
        className={cn(
          'font-bold leading-tight tracking-tight text-[var(--text-heading)]',
          titleSizeStyles[size],
        )}
        style={{
          fontFamily: "var(--font-display)",
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={cn(
            'text-[var(--text-muted)] mt-3 text-lg leading-relaxed max-w-2xl',
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };
