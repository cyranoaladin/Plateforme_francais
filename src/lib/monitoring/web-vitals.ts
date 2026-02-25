type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating: string;
  navigationType: string;
};

export function sendWebVital(metric: WebVitalMetric) {
  void fetch('/api/v1/metrics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: metric.name, value: metric.value }),
    keepalive: true,
  });
}
