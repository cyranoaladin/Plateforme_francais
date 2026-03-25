/**
 * EAF Analytics — Typed event schema + track() helper.
 * Events are buffered in window.__EAF_EVENTS__ for future sink integration.
 */

export type EafEvent =
  | { name: 'page_view'; props: { path: string; ref?: string } }
  | { name: 'cta_click'; props: { cta: string; path: string } }
  | { name: 'auth_submit'; props: { mode: 'login' | 'register' | 'forgot' | 'reset' } }
  | { name: 'auth_success'; props: { mode: 'login' | 'register' | 'forgot' | 'reset' } }
  | { name: 'auth_error'; props: { mode: 'login' | 'register' | 'forgot' | 'reset'; status?: number; code?: string } }
  | { name: 'rate_limited'; props: { mode: 'login' | 'register' | 'forgot' | 'reset'; retryAfterSec?: number } }
  | { name: 'onboarding_step_view'; props: { step: 1 | 2 | 3 } }
  | { name: 'onboarding_step_submit'; props: { step: 1 | 2 | 3 } }
  | { name: 'onboarding_complete'; props: Record<string, never> }
  | { name: 'pricing_plan_select'; props: { plan: string } }
  | { name: 'pricing_checkout_click'; props: { plan: string } }
  | { name: 'pricing_code_redeem_attempt'; props: { plan: string } }
  | { name: 'pricing_code_redeem_success'; props: { plan: string } }
  | { name: 'checkout_view'; props: { plan: string } }
  | { name: 'checkout_order_submit'; props: { plan: string; method: string } }
  | { name: 'checkout_order_success'; props: { plan: string; method: string; reference: string } }
  | { name: 'checkout_order_error'; props: { plan: string; method: string } };

declare global {
  interface Window {
    __EAF_EVENTS__?: Array<EafEvent & { ts: number }>;
  }
}

/**
 * Track an analytics event. Buffered in memory; can be connected to a sink later.
 */
export function track(evt: EafEvent): void {
  if (typeof window === 'undefined') return;
  window.__EAF_EVENTS__ ??= [];
  window.__EAF_EVENTS__.push({ ...evt, ts: Date.now() });
  if (process.env.NODE_ENV === 'development') {
    console.info('[EAF_EVENT]', evt);
  }
}
