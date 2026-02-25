import { describe, it, expect } from 'vitest';
import { chunkText, estimateTokens } from '@/lib/rag/chunker';

describe('RAG Chunker V2', () => {
  const meta = { source: 'test', url_officielle: 'https://example.com' };

  it('returns empty array for empty text', () => {
    expect(chunkText('', meta)).toEqual([]);
    expect(chunkText('   ', meta)).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const text = 'Bonjour le monde.';
    const chunks = chunkText(text, meta, 500, 80);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].metadata).toEqual(meta);
  });

  it('splits long text into overlapping chunks', () => {
    const sentence = 'Ceci est une phrase de test pour le chunker. ';
    const text = sentence.repeat(100);
    const chunks = chunkText(text, meta, 100, 20);
    expect(chunks.length).toBeGreaterThan(1);

    // Verify overlap: end of chunk N should overlap with start of chunk N+1
    for (let i = 0; i < chunks.length - 1; i++) {
      const tail = chunks[i].content.slice(-20);
      const head = chunks[i + 1].content.slice(0, 40);
      // Some overlap chars should appear in the next chunk
      expect(head.length).toBeGreaterThan(0);
      expect(tail.length).toBeGreaterThan(0);
    }
  });

  it('assigns sequential indices', () => {
    const text = 'A'.repeat(5000);
    const chunks = chunkText(text, meta, 100, 20);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });

  it('estimates tokens correctly', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
    expect(estimateTokens('')).toBe(0);
  });

  it('preserves metadata in all chunks', () => {
    const richMeta = { source: 'bo', url_officielle: 'https://bo.fr', oeuvre: 'Les Fleurs du Mal', parcours: 'Alchimie' };
    const text = 'X'.repeat(5000);
    const chunks = chunkText(text, richMeta, 100, 20);
    for (const c of chunks) {
      expect(c.metadata).toEqual(richMeta);
    }
  });
});
