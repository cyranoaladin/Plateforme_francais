import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: () => ({
    generateContent: generateContentMock,
  }),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: () => 100,
}));

describe('orchestrate', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
  });

  it('parse une réponse JSON valide selon le skill', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        answer: 'Réponse',
        citations: [{ title: 'Doc', url: 'https://example.test', excerpt: 'x' }],
        nextSteps: ['Relire la méthode'],
      }),
      model: 'mock-model',
      usage: { promptTokens: 10, completionTokens: 12, latencyMs: 20 },
    });

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'bibliothecaire',
      userQuery: 'Comment faire une intro ?',
      context: 'Source RAG',
      userId: 'u-1',
    });

    expect(result).toEqual({
      answer: 'Réponse',
      citations: [{ title: 'Doc', url: 'https://example.test', excerpt: 'x' }],
      nextSteps: ['Relire la méthode'],
    });
  });

  it('retourne un fallback structuré en cas de JSON non conforme', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({ bad: true }),
      model: 'mock-model',
    });

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'bibliothecaire',
      userQuery: 'Question',
      userId: 'u-2',
    });

    expect(result).toEqual({
      answer: "Je n'ai pas assez de sources fiables pour répondre précisément.",
      citations: [],
      nextSteps: ['Reformulez la question avec une oeuvre ou une notion précise.'],
    });
  });
});
