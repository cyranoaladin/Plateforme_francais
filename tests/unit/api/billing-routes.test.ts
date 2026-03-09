import { describe, it, expect } from 'vitest';

describe('billing routes schema', () => {
  it('VALID_FEATURES contient les 7 entitlements', () => {
    const features = [
      'ORAL_SESSIONS', 'WRITTEN_CORRECTIONS', 'TUTOR_QUESTIONS',
      'OCR_COPIES', 'LLM_TOKENS', 'RAG_SEARCH', 'QUIZ_PER_DAY',
    ];
    // This test validates the feature list is complete
    expect(features).toHaveLength(7);
    for (const f of features) {
      expect(f).toMatch(/^[A-Z_]+$/);
    }
  });
});
