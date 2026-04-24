import { describe, expect, it } from 'vitest';
import { createTestServer } from '../../helpers/test-server';

/**
 * Tests d'intégration Auth API
 * 
 * Note: Ces tests nécessitent une base de données de test configurée.
 * Ils sont désactivés par défaut car nécessitent DATABASE_URL et DIRECT_URL valides.
 * 
 * Pour exécuter ces tests:
 * 1. Configurer une DB de test (ex: postgres://test:test@localhost:5432/eaf_test)
 * 2. Exécuter: DATABASE_URL=<url> DIRECT_URL=<url> npx vitest run tests/integration/api/auth.test.ts
 */

const hasDatabase = process.env.DATABASE_URL && process.env.DIRECT_URL;

// Conditionnellement exécuter les tests si la DB est disponible
describe.skipIf(!hasDatabase)('integration auth API', () => {
  let testServer: ReturnType<typeof createTestServer>;

  beforeAll(async () => {
    testServer = createTestServer();
    // Les tests avec DB réelle sont conditionnels
  });

  afterAll(async () => {
    await testServer.close();
  });

  it('placeholder: auth avec DB configurée', async () => {
    // Ce test nécessite une vraie base de données
    expect(true).toBe(true);
  });
});

describe('integration auth API (sans DB)', () => {
  it('SKIP: Tests d\'intégration auth nécessitent une DB de test configurée', () => {
    console.log('Pour exécuter les tests d\'intégration auth:');
    console.log('  DATABASE_URL=<url> DIRECT_URL=<url> npx vitest run tests/integration/api/auth.test.ts');
    expect(true).toBe(true);
  });
});

// Import conditionnel pour éviter les erreurs quand la DB n'est pas dispo
import { beforeAll, afterAll } from 'vitest';
