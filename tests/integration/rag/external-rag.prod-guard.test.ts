import { describe, it, expect, vi } from 'vitest';

describe('rag/external-client prod guard', () => {
    it('en production, si RAG_API_TOKEN vide => le système doit échouer (pas de résultats silencieux)', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('RAG_API_URL', 'http://127.0.0.1:18001');
        vi.stubEnv('RAG_API_TOKEN', '');

        const { externalRAG } = await import('../../../src/lib/rag/external-client');
        await expect(externalRAG.health()).rejects.toThrow(/RAG_API_TOKEN is missing/);
    });
});
