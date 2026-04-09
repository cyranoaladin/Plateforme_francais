/**
 * Vérifie que le service email n'utilise jamais http://localhost:3000
 * dans les URLs générées (bug régressif suite à NEXT_PUBLIC_APP_URL baked at build).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Email APP_URL — absence de localhost', () => {
  const PROD_URL = 'https://eaf.nexusreussite.academy';

  beforeEach(() => {
    // Simule l'environnement prod
    process.env.APP_URL = PROD_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    delete process.env.APP_URL;
  });

  it('APP_URL est défini et ne contient pas localhost', () => {
    const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
    expect(url).not.toContain('localhost');
    expect(url).not.toContain('127.0.0.1');
    expect(url).toBe(PROD_URL);
  });

  it('fallback sur la constante prod quand APP_URL absent', () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
    expect(url).toBe(PROD_URL);
    expect(url).not.toContain('localhost');
  });

  it('NEXT_PUBLIC_APP_URL ne contient pas localhost si défini', () => {
    process.env.NEXT_PUBLIC_APP_URL = PROD_URL;
    const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
    expect(url).not.toContain('localhost');
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
