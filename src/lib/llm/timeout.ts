export function getLlmTimeoutMs(fallbackMs: number): number {
  const envValue = Number.parseInt(process.env.LLM_TIMEOUT_MS ?? '', 10);
  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue;
  }
  return fallbackMs;
}

export function createLlmTimeoutSignal(fallbackMs: number): AbortSignal {
  return AbortSignal.timeout(getLlmTimeoutMs(fallbackMs));
}
