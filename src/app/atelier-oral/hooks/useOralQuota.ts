'use client';

import { useCallback } from 'react';

export type OralQuotaError = {
  message: string;
  upgradeUrl: string | null;
};

export function resolveOralQuotaError(payload: unknown, fallbackMessage: string): OralQuotaError {
  if (!payload || typeof payload !== 'object') {
    return {
      message: fallbackMessage,
      upgradeUrl: null,
    };
  }

  const data = payload as {
    error?: unknown;
    upgradeUrl?: unknown;
  };

  return {
    message: typeof data.error === 'string' && data.error.length > 0 ? data.error : fallbackMessage,
    upgradeUrl: typeof data.upgradeUrl === 'string' && data.upgradeUrl.length > 0 ? data.upgradeUrl : null,
  };
}

export function useOralQuota() {
  const resolveError = useCallback((payload: unknown, fallbackMessage: string) => {
    return resolveOralQuotaError(payload, fallbackMessage);
  }, []);

  return {
    resolveError,
  };
}
