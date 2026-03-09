'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';

type QuotaStatus = {
  allowed: boolean;
  message?: string;
  planLabel?: string;
  loading: boolean;
};

export function useQuotaCheck(feature: string): QuotaStatus {
  const [status, setStatus] = useState<QuotaStatus>({ allowed: true, loading: true });

  useEffect(() => {
    apiFetch<{ allowed: boolean; reason?: string; plan?: string; message?: string }>(
      `/api/v1/billing/check-quota?feature=${encodeURIComponent(feature)}`,
    )
      .then((data) => {
        setStatus({
          allowed: data.allowed,
          message: data.message ?? data.reason,
          planLabel: data.plan,
          loading: false,
        });
      })
      .catch(() => setStatus({ allowed: true, loading: false }));
  }, [feature]);

  return status;
}
