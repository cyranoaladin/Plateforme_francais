/**
 * Lightweight LRU cache with TTL support.
 * Used for student profiles, RAG results, and other short-lived data.
 *
 * Security: keys must include userId or be shared-safe (e.g., RAG corpus data).
 * No cross-student leakage — callers are responsible for key isolation.
 */
export class LRUCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(opts: { maxSize?: number; defaultTtlMs?: number } = {}) {
    this.maxSize = opts.maxSize ?? 200;
    this.defaultTtlMs = opts.defaultTtlMs ?? 300_000; // 5 minutes
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
