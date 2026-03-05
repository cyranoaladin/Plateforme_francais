import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ChatTuteur component', () => {
  it('utilise endpoint tuteur et affiche citations', () => {
    const file = path.resolve(process.cwd(), 'src/app/tuteur/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('/api/v1/tuteur/message');
    expect(src).toContain('message.citations');
    expect(src).toContain('conversationHistory');
  });
});
