import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dbClientMocks = vi.hoisted(() => ({
  isDatabaseAvailable: vi.fn(),
  assertDatabaseAvailable: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    studentProfile: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/db/client', () => dbClientMocks);

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('go-live guards', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('bloque le fallback auth JSON en production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { readFallbackStore } = await import('@/lib/db/fallback-store');
    await expect(readFallbackStore()).rejects.toThrow('FallbackStore désactivé: persistance DB obligatoire.');
  });

  it('bloque le fallback epreuves JSON en production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { readEpreuvesFallbackStore } = await import('@/lib/epreuves/fallback-store');
    await expect(readEpreuvesFallbackStore()).rejects.toThrow('Epreuves fallback store désactivé: persistance DB obligatoire.');
  });

  it('bloque le premium-store JSON en production si la DB est indisponible', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    dbClientMocks.assertDatabaseAvailable.mockRejectedValue(new Error('premium-store JSON fallback interdit en production'));

    const { addErrorBankItem } = await import('@/lib/store/premium-store');

    await expect(addErrorBankItem({
      studentId: 'stu-prod',
      errorType: 'plan_desequilibre',
      category: 'ecrit',
      microSkillId: 'ecrit_plan',
      example: 'exemple',
      correction: 'correction',
      sourceInteractionId: 'interaction-1',
      sourceAgent: 'correcteur',
    })).rejects.toThrow('premium-store JSON fallback interdit en production');
  });
});

describe('global-error hardening', () => {
  it('reste autonome et suffisamment détaillé', () => {
    const filePath = join(process.cwd(), 'src/app/global-error.tsx');
    const content = readFileSync(filePath, 'utf8');

    expect(Buffer.byteLength(content, 'utf8')).toBeGreaterThan(1500);
    expect(content).not.toMatch(/useContext|Provider/);
    expect(content).not.toMatch(/import.*components|import.*ui/);
    expect(content).toContain('contact@nexusreussite.academy');
    expect(content).toContain('Retour à l\'accueil');
  });
});
