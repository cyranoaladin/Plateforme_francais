/**
 * API fetch wrapper with CSRF double-submit, Retry-After handling,
 * and structured error responses.
 */

import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  retryAfterSec?: number;
};

/**
 * Type guard for ApiError.
 */
export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err && 'message' in err;
}

/**
 * Fetch wrapper that:
 * - Injects CSRF token from cookie on mutative requests
 * - Parses Retry-After header on 429
 * - Returns typed JSON response or throws ApiError
 */
export async function apiFetch<T>(
  input: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  const csrf = getCsrfTokenFromDocument();
  if (csrf) {
    headers.set('X-CSRF-Token', csrf);
  }

  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(input, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    credentials: 'include',
  });

  if (!res.ok) {
    // 18C: On 401, redirect to login with session_expired reason.
    // This handles evicted sessions (anti-sharing FIFO eviction).
    if (res.status === 401 && typeof window !== 'undefined') {
      const current = window.location.pathname;
      if (current !== '/login') {
        window.location.href = `/login?reason=session_expired&redirect=${encodeURIComponent(current)}`;
        // Return a never-resolving promise so callers don't process stale data.
        return new Promise<T>(() => {});
      }
    }

    const retryAfter = res.headers.get('Retry-After');
    let msg = 'Une erreur est survenue.';
    let code: string | undefined;
    try {
      const data = (await res.json()) as { error?: string; message?: string; code?: string };
      msg = data?.error ?? data?.message ?? msg;
      code = data?.code;
    } catch {
      // Response may not be JSON
    }
    const err: ApiError = {
      status: res.status,
      code,
      message: msg,
      retryAfterSec: retryAfter ? Number(retryAfter) : undefined,
    };
    throw err;
  }

  return (await res.json()) as T;
}
