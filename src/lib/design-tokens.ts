/**
 * EAF Platform — Design Tokens
 * ==============================
 * Single source of truth for every visual decision across the platform.
 *
 * Usage:
 *   import { colors, typography, spacing } from '@/lib/design-tokens';
 *   import tokens from '@/lib/design-tokens';
 *
 * All values use `as const` for full type safety and autocompletion.
 */

// ---------------------------------------------------------------------------
// 1. COLOR PALETTE
// ---------------------------------------------------------------------------

/** Semantic color palette — Nouvelle charte graphique Nexus Réussite 2026 */
export const colors = {
  /** Primary Bleu Académique — conveys trust, seriousness, education */
  primary: {
    DEFAULT: '#1E3A5F', // Bleu Académique
    dark: '#0F1F33',    // Bleu Profond
    light: '#4A7C9B',   // Bleu Clair
    muted: '#5f7388',
  },

  /** Secondary teal — conveys growth, progress, achievement */
  secondary: {
    DEFAULT: '#2D8A5E', // Vert Validation
    light: '#14b8a6',
  },

  /** Accent Or Réussite — conveys premium quality, excellence */
  accent: {
    gold: '#D4A853',    // Or Réussite
    goldDark: '#B8943F', // Or Réussite gradient end
    warm: '#E07B39',    // Orange Accent
    bronze: '#b87333',
  },

  /** Warm neutral surfaces — Nouvelle charte */
  surface: {
    white: '#FAFBFC',   // Blanc Cassé
    cream: '#f4eee3',
    ivory: '#fffdf9',
    warm: '#fbf7ef',
    paper: '#fcfaf6',
    light: '#F0F2F5',   // Gris Clair
  },

  /** Borders — warm neutrals that pair with surfaces */
  border: {
    DEFAULT: '#E8EBF0',
    light: '#e7dac6',
    dark: '#D1D5DB',
  },

  /** Text hierarchy — Nouvelle charte */
  text: {
    heading: '#1A1D23',  // Noir Doux
    body: '#3D4852',     // Gris Foncé
    muted: '#8A94A6',    // Gris Moyen
    placeholder: '#94a3b8',
  },

  /** Status / feedback colors — Nouvelle charte */
  status: {
    success: '#2D8A5E',  // Vert Validation
    successBg: '#edf7f3',
    warning: '#E07B39',  // Orange Accent
    warningBg: '#fff7ea',
    error: '#C44536',    // Rouge Correction
    errorBg: '#fff0ed',
    info: '#4A7C9B',     // Bleu Clair
    infoBg: '#eff6ff',
  },

  /** Dark surfaces for contrast sections, sidebars, footers — Nouvelle charte */
  dark: {
    DEFAULT: '#0F1F33',  // Bleu Profond
    lighter: '#1E3A5F',  // Bleu Académique
  },
} as const;

// ---------------------------------------------------------------------------
// 2. TYPOGRAPHY
// ---------------------------------------------------------------------------

/** Typography scale — display serif for headings, Inter sans for body. */
export const typography = {
  /** Font family stacks */
  fontFamily: {
    display:
      '"Playfair Display", "Georgia", "Cambria", "Times New Roman", serif',
    body: '"Inter", "Helvetica Neue", "Arial", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
  },

  /** Font size scale (px) */
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },

  /** Font weight */
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  /** Line height */
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.8,
  },

  /** Letter spacing */
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ---------------------------------------------------------------------------
// 3. SPACING
// ---------------------------------------------------------------------------

/** Spacing scale built on a 4 px base unit. Keys are multipliers. */
export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ---------------------------------------------------------------------------
// 4. BORDER RADIUS
// ---------------------------------------------------------------------------

/** Normalized radius scale — five deliberate values, nothing in between. */
export const borderRadius = {
  /** Badges, tags, small interactive elements */
  sm: '6px',
  /** Inputs, buttons, form controls */
  md: '10px',
  /** Cards, panels, containers */
  lg: '16px',
  /** Hero cards, premium surfaces */
  xl: '24px',
  /** Pills, avatars, fully rounded */
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// 5. SHADOWS (elevation system)
// ---------------------------------------------------------------------------

/** Box-shadow elevation tokens — from subtle to dramatic. */
export const shadows = {
  /** Cards at rest */
  xs: '0 1px 2px 0 rgba(23, 50, 77, 0.04)',
  /** Hover states, slight lift */
  sm: '0 2px 6px -1px rgba(23, 50, 77, 0.07), 0 1px 3px -1px rgba(23, 50, 77, 0.04)',
  /** Dropdowns, floating elements */
  md: '0 6px 16px -4px rgba(23, 50, 77, 0.10), 0 2px 6px -2px rgba(23, 50, 77, 0.05)',
  /** Modals, overlays */
  lg: '0 12px 32px -6px rgba(23, 50, 77, 0.14), 0 4px 12px -2px rgba(23, 50, 77, 0.06)',
  /** Hero elements, dramatic depth */
  xl: '0 24px 48px -12px rgba(23, 50, 77, 0.20), 0 8px 20px -4px rgba(23, 50, 77, 0.08)',
  /** Inset / pressed state */
  inner: 'inset 0 2px 4px 0 rgba(23, 50, 77, 0.06)',
  /** Premium gold glow for badges and CTAs */
  gold: '0 4px 20px -4px rgba(212, 175, 55, 0.35), 0 0 0 1px rgba(212, 175, 55, 0.12)',
} as const;

// ---------------------------------------------------------------------------
// 6. GRADIENTS
// ---------------------------------------------------------------------------

/** Reusable CSS gradient strings — Nouvelle charte graphique */
export const gradients = {
  /** Hero gradient — Bleu Académique vers Bleu Profond */
  hero: 'linear-gradient(135deg, #1E3A5F 0%, #0F1F33 100%)',
  /** CTA Or gradient */
  ctaGold: 'linear-gradient(135deg, #D4A853 0%, #B8943F 100%)',
  /** Carte Premium gradient */
  cardPremium: 'linear-gradient(135deg, #FAFBFC 0%, #F0F2F5 100%)',
  /** Deep navy gradient for dark hero sections and footers */
  primaryDark: 'linear-gradient(135deg, #0F1F33 0%, #1E3A5F 50%, #0F1F33 100%)',
  /** Warm cream gradient for sidebar and navigation */
  sidebarBg: 'linear-gradient(180deg, #FAFBFC 0%, #F0F2F5 100%)',
  /** Semi-transparent overlay for landing hero images */
  heroOverlay: 'linear-gradient(180deg, rgba(15, 31, 51, 0.75) 0%, rgba(30, 58, 95, 0.55) 100%)',
  /** Metallic gold shine for premium badges — Or Réussite */
  goldShine: 'linear-gradient(135deg, #D4A853 0%, #f5d76e 40%, #D4A853 60%, #B8943F 100%)',

  /** Atelier-specific gradients — one per discipline */
  atelierOral: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  atelierEcrit: 'linear-gradient(135deg, #b87333 0%, #d4a06a 100%)',
  atelierLangue: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  atelierLecture: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
} as const;

// ---------------------------------------------------------------------------
// 7. TRANSITIONS
// ---------------------------------------------------------------------------

/** Transition presets for consistent motion across the UI. */
export const transitions = {
  /** Micro-interactions: toggles, icon changes */
  fast: '150ms ease-out',
  /** Default UI transitions: hovers, color shifts */
  base: '250ms ease',
  /** Larger layout shifts, panel slides */
  slow: '400ms ease-in-out',
  /** Playful spring easing for bouncy interactions */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ---------------------------------------------------------------------------
// 8. Z-INDEX LAYERS
// ---------------------------------------------------------------------------

/** Z-index scale — predictable layering with room between values. */
export const zIndex = {
  base: 1,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

// ---------------------------------------------------------------------------
// 9. BREAKPOINTS
// ---------------------------------------------------------------------------

/** Responsive breakpoints (min-width, mobile-first). */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ---------------------------------------------------------------------------
// DEFAULT EXPORT — grouped token object
// ---------------------------------------------------------------------------

/** All design tokens grouped under a single namespace. */
const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  gradients,
  transitions,
  zIndex,
  breakpoints,
} as const;

export default tokens;
