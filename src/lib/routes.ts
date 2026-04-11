/**
 * routes.ts — Single source of truth for all navigation hrefs.
 * Import ROUTES in every component instead of hardcoding paths.
 */
export const ROUTES = {
  register: '/login?mode=register',
  login: '/login',
  pricing: '/#tarifs',
  workshops: '/#ateliers',
  registerOral: '/login?mode=register&atelier=oral',
  registerEcrit: '/login?mode=register&atelier=ecrit',
  registerLangue: '/login?mode=register&atelier=langue',
  registerQuiz: '/login?mode=register&atelier=quiz',
  registerCorrection: '/login?mode=register&action=correction',
  registerFree: '/login?mode=register&plan=free',
  registerPremium: '/login?mode=register&plan=premium',
  registerMasterium: '/login?mode=register&plan=masterium',
  legal: '/mentions-legales',
  privacy: '/politique-de-confidentialite',
  terms: '/cgu',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? 'https://wa.me/21699192829',
  email: 'mailto:contact@nexusreussite.academy',
} as const;

export type RouteKey = keyof typeof ROUTES;
