import { describe, expect, it } from 'vitest';
import { scoreFromDistance } from '@/lib/rag/vector-search';

describe('DB vector-search', () => {
  it('score décroît avec la distance', () => {
    const near = scoreFromDistance(0.1);
    const far = scoreFromDistance(0.9);
    expect(near).toBeGreaterThan(far);
  });
});
