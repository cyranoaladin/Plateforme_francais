import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('QuizPlayer component', () => {
  it('configure thème/difficulté/nbQuestions et appelle generate', () => {
    const file = path.resolve(process.cwd(), 'src/app/quiz/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('quiz-theme');
    expect(src).toContain('quiz-difficulte');
    expect(src).toContain('quiz-nb-questions');
    expect(src).toContain('/api/v1/quiz/generate');
  });
});
