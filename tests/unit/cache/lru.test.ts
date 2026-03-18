import { describe, it, expect, vi, afterEach } from 'vitest';
import { LRUCache } from '@/lib/cache/lru';

describe('LRUCache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stocke et récupère une valeur', () => {
    const cache = new LRUCache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('retourne undefined pour une clé absente', () => {
    const cache = new LRUCache<string>();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expire les entrées après le TTL', () => {
    vi.useFakeTimers();
    const cache = new LRUCache<string>({ defaultTtlMs: 1000 });
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(1001);
    expect(cache.get('key1')).toBeUndefined();
    vi.useRealTimers();
  });

  it('évince l\'entrée la plus ancienne quand plein', () => {
    const cache = new LRUCache<string>({ maxSize: 2 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3'); // should evict 'a'

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
  });

  it('rafraîchit l\'ordre LRU sur get()', () => {
    const cache = new LRUCache<string>({ maxSize: 2 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.get('a'); // refresh 'a'
    cache.set('c', '3'); // should evict 'b' (oldest unused)

    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe('3');
  });

  it('invalide par préfixe', () => {
    const cache = new LRUCache<string>();
    cache.set('profile:u1:work1', 'v1');
    cache.set('profile:u1:work2', 'v2');
    cache.set('profile:u2:work1', 'v3');

    cache.invalidatePrefix('profile:u1:');

    expect(cache.get('profile:u1:work1')).toBeUndefined();
    expect(cache.get('profile:u1:work2')).toBeUndefined();
    expect(cache.get('profile:u2:work1')).toBe('v3');
  });

  it('retourne la taille courante', () => {
    const cache = new LRUCache<number>();
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
    cache.invalidate('a');
    expect(cache.size).toBe(1);
  });
});
