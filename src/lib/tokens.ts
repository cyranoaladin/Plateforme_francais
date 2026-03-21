/**
 * tokens.ts — Design tokens "Encre & Lumière"
 * Single source of truth for all colors, typography, spacing.
 */
export const tokens = {
  colors: {
    ink: {
      950: '#060D1F',
      900: '#0D1F3C',
      800: '#1A3560',
      700: '#1E4080',
    },
    sapphire: {
      700: '#1D4ED8',
      600: '#2563EB',
      500: '#3B82F6',
      100: '#DBEAFE',
      50: '#EFF6FF',
    },
    gold: {
      700: '#B45309',
      600: '#D97706',
      500: '#F59E0B',
      100: '#FEF3C7',
      50: '#FFFBEB',
    },
    page: '#F9F8FF',
    surface: '#FFFFFF',
    border: '#E8E6F0',
    text: {
      primary: '#0A0F1E',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#F8FAFC',
    },
    success: '#10B981',
    error: '#EF4444',
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shadow: {
    card: '0 1px 3px rgba(10,15,30,0.06), 0 4px 16px rgba(10,15,30,0.04)',
    cta: '0 4px 20px rgba(29,78,216,0.35)',
    hero: '0 20px 60px rgba(6,13,31,0.6)',
  },
} as const;
