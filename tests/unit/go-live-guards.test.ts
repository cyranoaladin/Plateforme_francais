import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OBJETS_ETUDE, DESCRIPTIF_REGLEMENTAIRE, THEMES_GRAMMAIRE_EAF } from '@/data/programme-eaf-2025';
import { BAREME_COMMENTAIRE_SERIE_GENERALE, BAREME_DISSERTATION, BAREME_GRAMMAIRE } from '@/data/baremes-officiels';
import { PLAN_CATALOG, PLAN_DISPLAY_LABELS } from '@/lib/billing/plan-catalog';
import { PUBLIC_PLAN_OFFERS } from '@/lib/billing/public-offers';

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

describe('EAF pedagogy guards — programme officiel', () => {
  it('contient exactement 4 objets d\'étude (BO 2025)', () => {
    expect(OBJETS_ETUDE).toHaveLength(4);
    const ids = OBJETS_ETUDE.map((o) => o.id);
    expect(ids).toContain('POESIE');
    expect(ids).toContain('THEATRE');
    expect(ids).toContain('LITTERATURE_IDEES');
    expect(ids).toContain('ROMAN_RECIT');
  });

  it('chaque objet d\'étude a 3 œuvres et 3 parcours', () => {
    for (const obj of OBJETS_ETUDE) {
      expect(obj.oeuvres, `${obj.id} doit avoir 3 œuvres`).toHaveLength(3);
      expect(obj.parcours, `${obj.id} doit avoir 3 parcours`).toHaveLength(3);
    }
  });

  it('le descriptif réglementaire exige ≥ 16 textes', () => {
    expect(DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum).toBeGreaterThanOrEqual(16);
  });

  it('les thèmes de grammaire sont ≥ 5 (BO programme)', () => {
    expect(THEMES_GRAMMAIRE_EAF.length).toBeGreaterThanOrEqual(5);
  });
});

describe('EAF pedagogy guards — barèmes officiels NS 2019-042', () => {
  it('commentaire : total = 20, 4 critères', () => {
    expect(BAREME_COMMENTAIRE_SERIE_GENERALE.total).toBe(20);
    expect(BAREME_COMMENTAIRE_SERIE_GENERALE.criteres).toHaveLength(4);
    const sum = BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.reduce((s, c) => s + c.points, 0);
    expect(sum).toBe(20);
  });

  it('dissertation : total = 20, 4 critères', () => {
    expect(BAREME_DISSERTATION.total).toBe(20);
    expect(BAREME_DISSERTATION.criteres).toHaveLength(4);
    const sum = BAREME_DISSERTATION.criteres.reduce((s, c) => s + c.points, 0);
    expect(sum).toBe(20);
  });

  it('grammaire : total = 2, 1 critère, 3 niveaux', () => {
    expect(BAREME_GRAMMAIRE.total).toBe(2);
    expect(BAREME_GRAMMAIRE.criteres).toHaveLength(1);
    expect(BAREME_GRAMMAIRE.criteres[0].niveaux).toHaveLength(3);
  });

  it('chaque critère a 4 niveaux (sauf grammaire)', () => {
    for (const c of BAREME_COMMENTAIRE_SERIE_GENERALE.criteres) {
      expect(c.niveaux, `commentaire/${c.id}`).toHaveLength(4);
    }
    for (const c of BAREME_DISSERTATION.criteres) {
      expect(c.niveaux, `dissertation/${c.id}`).toHaveLength(4);
    }
  });
});

describe('billing guards — plan catalog coherence', () => {
  it('3 plans définis : FREE, PREMIUM, PRO', () => {
    expect(Object.keys(PLAN_CATALOG)).toEqual(['FREE', 'PREMIUM', 'PRO']);
  });

  it('prix croissant FREE < PREMIUM < PRO', () => {
    expect(PLAN_CATALOG.FREE.priceTnd).toBe(0);
    expect(PLAN_CATALOG.PREMIUM.priceTnd).toBeGreaterThan(PLAN_CATALOG.FREE.priceTnd);
    expect(PLAN_CATALOG.PRO.priceTnd).toBeGreaterThan(PLAN_CATALOG.PREMIUM.priceTnd);
  });

  it('chaque plan a des quotas ORAL_SESSIONS et WRITTEN_CORRECTIONS', () => {
    for (const planId of Object.keys(PLAN_CATALOG) as Array<keyof typeof PLAN_CATALOG>) {
      const q = PLAN_CATALOG[planId].quotas;
      expect(q.ORAL_SESSIONS, `${planId} oral`).toBeDefined();
      expect(q.WRITTEN_CORRECTIONS, `${planId} written`).toBeDefined();
    }
  });

  it('display labels existent pour chaque plan', () => {
    expect(PLAN_DISPLAY_LABELS.FREE).toBe('Freemium');
    expect(PLAN_DISPLAY_LABELS.PREMIUM).toBe('Premium');
    expect(PLAN_DISPLAY_LABELS.PRO).toBe('Masterium');
  });

  it('3 offres publiques générées', () => {
    expect(PUBLIC_PLAN_OFFERS).toHaveLength(3);
    const ids = PUBLIC_PLAN_OFFERS.map((o) => o.technicalId);
    expect(ids).toEqual(['FREE', 'PREMIUM', 'PRO']);
  });

  it('chaque offre publique a un CTA et un prix', () => {
    for (const offer of PUBLIC_PLAN_OFFERS) {
      expect(offer.cta.length).toBeGreaterThan(0);
      expect(offer.priceTnd).toBeDefined();
    }
  });
});
