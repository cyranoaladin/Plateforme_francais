type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating: string;
  navigationType: string;
};

const sentMetrics = new Set<string>();

export function sendWebVital(metric: WebVitalMetric) {
  const fingerprint = `${metric.name}:${metric.id}`;
  if (sentMetrics.has(fingerprint)) {
    return;
  }
  sentMetrics.add(fingerprint);

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/v1/metrics/vitals', blob);
    return;
  }

  void fetch('/api/v1/metrics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    sentMetrics.delete(fingerprint);
  });
}
