import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/validation/request';

const testSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  score: z.number().min(0).max(20),
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('parseJsonBody', () => {
  it('retourne success:true pour un payload valide', async () => {
    const req = makeRequest({ name: 'Alice', score: 15 });
    const result = await parseJsonBody(req, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alice');
      expect(result.data.score).toBe(15);
    }
  });

  it('retourne success:false avec details pour un payload invalide Zod', async () => {
    const req = makeRequest({ name: '', score: 25 });
    const result = await parseJsonBody(req, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(body.error).toBe('Payload invalide.');
      expect(body.details).toBeDefined();
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
    }
  });

  it('retourne success:false pour JSON malformé', async () => {
    const req = new Request('http://localhost/test', {
      method: 'POST',
      body: 'ceci nest pas du json{{{',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonBody(req, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(body.error).toBe('Payload JSON invalide.');
    }
  });

  it('retourne 400 comme status HTTP pour erreur Zod', async () => {
    const req = makeRequest({ name: 123, score: 'abc' });
    const result = await parseJsonBody(req, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it('retourne 400 comme status HTTP pour JSON malformé', async () => {
    const req = new Request('http://localhost/test', {
      method: 'POST',
      body: '}{invalid',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonBody(req, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});
