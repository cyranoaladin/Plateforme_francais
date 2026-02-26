import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFTemplate } from '@/lib/pdf/generator';

/**
 * PDF generator tests.
 *
 * generateDocument / generateBilanOralDocument / generateRapportEcritDocument
 * require filesystem and database access. We mock the dependencies to test
 * the rendering logic and document metadata in isolation.
 */

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(false),
  prisma: { documentDeposit: { create: vi.fn() } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('PDFTemplate enum', () => {
  it('defines BILAN_ORAL template', () => {
    expect(PDFTemplate.BILAN_ORAL).toBe('bilan-oral');
  });

  it('defines RAPPORT_ECRIT template', () => {
    expect(PDFTemplate.RAPPORT_ECRIT).toBe('rapport-ecrit');
  });

  it('defines RAPPORT_ONBOARDING template', () => {
    expect(PDFTemplate.RAPPORT_ONBOARDING).toBe('rapport-onboarding');
  });

  it('defines FICHE_OEUVRE template', () => {
    expect(PDFTemplate.FICHE_OEUVRE).toBe('fiche-oeuvre');
  });

  it('defines CARNET_REVISION template', () => {
    expect(PDFTemplate.CARNET_REVISION).toBe('carnet-revision');
  });
});

describe('generateDocument (mocked FS)', () => {
  let generateDocument: typeof import('@/lib/pdf/generator').generateDocument;

  beforeEach(async () => {
    const mod = await import('@/lib/pdf/generator');
    generateDocument = mod.generateDocument;
  });

  it('BILAN_ORAL template includes note/20 and 4 phases', async () => {
    const result = await generateDocument({
      template: PDFTemplate.BILAN_ORAL,
      data: {
        title: 'Bilan Oral EAF',
        note: 14,
        maxNote: 20,
        mention: 'Bien',
        phases: {
          LECTURE: { note: 1.5, max: 2, commentaire: 'Bonne fluidité' },
          EXPLICATION: { note: 6, max: 8, commentaire: 'Analyse correcte' },
          GRAMMAIRE: { note: 1.5, max: 2, commentaire: 'Identification juste' },
          ENTRETIEN: { note: 5, max: 8, commentaire: 'Connaissance solide' },
        },
        bilan_global: 'Session globalement satisfaisante.',
        conseil_final: 'Travailler les transitions.',
      },
      userId: 'test-user',
      filename: 'test-bilan',
    });

    expect(result.html).toContain('14');
    expect(result.html).toContain('/20');
    expect(result.html).toContain('LECTURE');
    expect(result.html).toContain('EXPLICATION');
    expect(result.html).toContain('GRAMMAIRE');
    expect(result.html).toContain('ENTRETIEN');
    expect(result.html).toContain('Bien');
  });

  it('RAPPORT_ECRIT template includes rubriques table', async () => {
    const result = await generateDocument({
      template: PDFTemplate.RAPPORT_ECRIT,
      data: {
        title: 'Rapport de Correction EAF',
        note: 12,
        mention: 'Assez bien',
        rubriques: [
          { titre: 'Compréhension', note: 3, max: 4, appreciation: 'Correcte' },
          { titre: 'Analyse littéraire', note: 5, max: 8, appreciation: 'À approfondir' },
        ],
      },
      userId: 'test-user',
      filename: 'test-rapport',
    });

    expect(result.html).toContain('Compréhension');
    expect(result.html).toContain('Analyse littéraire');
    expect(result.html).toContain('3');
  });

  it('RAPPORT_ONBOARDING template includes priorites list', async () => {
    const result = await generateDocument({
      template: PDFTemplate.RAPPORT_ONBOARDING,
      data: {
        title: 'Rapport Onboarding',
        niveau: 'Passable',
        priorites: ['Structuration', 'Argumentation'],
      },
      userId: 'test-user',
      filename: 'test-onboarding',
    });

    expect(result.html).toContain('Passable');
    expect(result.html).toContain('Structuration');
    expect(result.html).toContain('Argumentation');
  });

  it('escapeHtml prevents XSS injection', async () => {
    const result = await generateDocument({
      template: PDFTemplate.BILAN_ORAL,
      data: {
        title: '<script>alert("xss")</script>',
        note: 10,
        maxNote: 20,
        mention: 'Passable',
      },
      userId: 'test-user',
      filename: 'test-xss',
    });

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('generateDocument returns url, key, and html', async () => {
    const result = await generateDocument({
      template: PDFTemplate.BILAN_ORAL,
      data: { title: 'Test', note: 10, maxNote: 20, mention: 'Passable' },
      userId: 'test-user',
      filename: 'test-doc',
    });

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('html');
    expect(typeof result.html).toBe('string');
    expect(result.html.length).toBeGreaterThan(0);
  });
});

describe('generateBilanOralDocument', () => {
  it('creates correct title', async () => {
    const { generateBilanOralDocument } = await import('@/lib/pdf/generator');
    const result = await generateBilanOralDocument('user-1', { note: 15, mention: 'Bien' }, 'Alice');
    expect(result.html).toContain('Bilan Oral EAF');
    expect(result.html).toContain('Alice');
  });
});
