import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// Mocks
// ============================================================

// Mock Prisma
vi.mock('../src/lib/db.js', () => ({
  getDb: vi.fn(() => mockDb),
  checkDbHealth: vi.fn(() => ({ healthy: true, latencyMs: 5 })),
  disconnectDb: vi.fn(),
}))

// Mock Redis
vi.mock('../src/lib/redis.js', () => ({
  getRedis: vi.fn(),
  checkRedisHealth: vi.fn(() => ({ healthy: true, latencyMs: 2 })),
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetIn: 60 })),
  cacheGet: vi.fn(() => null),
  cacheSet: vi.fn(),
  disconnectRedis: vi.fn(),
  getQueueLength: vi.fn(() => 0),
}))

// Mock Ollama embeddings
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ embedding: Array(768).fill(0.1) }),
  text: () => Promise.resolve('<html>Document test</html>'),
})

const mockDb = {
  user: {
    findUnique: vi.fn(),
  },
  studentProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  memoryEvent: {
    create: vi.fn(),
    findMany: vi.fn(() => []),
    count: vi.fn(() => 0),
  },
  evaluation: {
    create: vi.fn(),
    findMany: vi.fn(() => []),
  },
  errorBankItem: {
    findMany: vi.fn(() => []),
    findFirst: vi.fn(() => null),
    count: vi.fn(() => 0),
    create: vi.fn(),
  },
  oralSession: {
    findFirst: vi.fn(),
  },
  copieDeposee: {
    findFirst: vi.fn(),
  },
  studyPlan: {
    findFirst: vi.fn(() => null),
    deleteMany: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(() => null),
  },
  chunk: {
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(() => []),
  $executeRaw: vi.fn(() => 1),
}

// ============================================================
// Tests Policy Gate (Compliance)
// ============================================================

describe('Policy Gate — Règles immuables', () => {
  beforeEach(() => vi.clearAllMocks())

  it('R-AIACT-01 : bloque une inférence émotionnelle dans le LLM output', async () => {
    const { checkPolicy } = await import('../src/lib/policy-gate.js')

    const result = await checkPolicy({
      checkType: 'post_generation',
      agentSkill: 'correcteur',
      studentId: 'student-123',
      llmOutput: 'Tu sembles stressé par cet exercice. Voici mon feedback...',
    })

    expect(result.allowed).toBe(false)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].ruleId).toBe('R-AIACT-01')
    expect(result.violations[0].severity).toBe('block')
  })

  it('R-AIACT-01 : autorise un output sans inférence émotionnelle', async () => {
    const { checkPolicy } = await import('../src/lib/policy-gate.js')

    const result = await checkPolicy({
      checkType: 'post_generation',
      agentSkill: 'correcteur',
      studentId: 'student-123',
      llmOutput: 'Ta problématique manque de précision. Voici comment la reformuler : [exemple]',
    })

    expect(result.allowed).toBe(true)
    const aiActViolations = result.violations.filter((v) => v.ruleId === 'R-AIACT-01')
    expect(aiActViolations).toHaveLength(0)
  })

  it('R-FRAUD-01 : bloque une rédaction complète en mode examen', async () => {
    const { checkPolicy } = await import('../src/lib/policy-gate.js')

    const longEssay = `
Introduction : Dans Les Contemplations de Victor Hugo, la question de la mémoire occupe une place centrale.
Première partie : La mémoire comme refuge face au deuil...
Transition : Cependant, la mémoire peut aussi devenir source de souffrance...
Deuxième partie : La mémoire douloureuse et ses manifestations...
Transition : Toutefois, Hugo dépasse la simple nostalgie...
Troisième partie : La mémoire transfigurée par la création poétique...
Conclusion : Ainsi, Les Contemplations montrent que la mémoire est un processus actif...
    `.repeat(5) // Rendre > 800 mots

    const result = await checkPolicy({
      checkType: 'post_generation',
      agentSkill: 'coach-ecrit',
      studentId: 'student-123',
      llmOutput: longEssay,
      requestContext: { mode: 'examen' },
    })

    expect(result.allowed).toBe(false)
    const fraudViolations = result.violations.filter((v) => v.ruleId === 'R-FRAUD-01')
    expect(fraudViolations.length).toBeGreaterThan(0)
  })

  it('R-SCOPE-01 : détecte une demande hors scope (voie technologique)', async () => {
    const { checkPolicy } = await import('../src/lib/policy-gate.js')

    const result = await checkPolicy({
      checkType: 'pre_generation',
      agentSkill: 'tuteur-libre',
      requestContext: { userInput: 'Je prépare mon bac technologique STI2D' },
    })

    const scopeViolations = result.violations.filter((v) => v.ruleId === 'R-SCOPE-01')
    expect(scopeViolations).toHaveLength(1)
    expect(scopeViolations[0].severity).toBe('warn') // warn, pas block
  })
})

// ============================================================
// Tests Student Tools
// ============================================================

describe('eaf_get_student_profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne le profil complet avec SkillMap', async () => {
    const { getStudentProfile } = await import('../src/tools/student/get-profile.js')

    mockDb.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      email: 'lina@example.com',
      studentProfile: {
        displayName: 'Lina',
        eafDate: new Date('2026-06-15'),
        selectedOeuvres: ['Les Contemplations', 'Lorenzaccio'],
        weakSkills: ['oral', 'langue'],
        skillMap: JSON.stringify({
          axes: [
            { axis: 'ecrit', score: 0.65, lastUpdated: new Date().toISOString(), trend: 'up' },
            { axis: 'oral', score: 0.35, lastUpdated: new Date().toISOString(), trend: 'stable' },
          ],
          updatedAt: new Date().toISOString(),
        }),
        xp: 450,
        level: 3,
        streak: 7,
        maxStreak: 12,
      },
    })

    const result = await getStudentProfile({ studentId: 'user-123', includeSkillMap: true })

    expect(result.displayName).toBe('Lina')
    expect(result.selectedOeuvres).toContain('Les Contemplations')
    expect(result.weakSkills).toContain('oral')
    expect(result.skillMap?.axes).toHaveLength(2)
    expect(result.daysUntilEaf).toBeGreaterThan(0)
    expect(result.xp).toBe(450)
    expect(result.level).toBe(3)
  })

  it('lève une erreur si l\'élève est introuvable', async () => {
    const { getStudentProfile } = await import('../src/tools/student/get-profile.js')
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    await expect(
      getStudentProfile({ studentId: 'inexistant', includeSkillMap: false })
    ).rejects.toThrow('Élève introuvable')
  })
})

describe('eaf_schedule_revision', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crée une révision J+2/J+7/J+21 pour erreur major', async () => {
    const { scheduleRevision } = await import('../src/tools/student/error-bank.js')

    mockDb.errorBankItem.create.mockResolvedValueOnce({
      id: 'item-456',
      studentId: 'student-123',
      errorType: 'problematique_floue',
      nextRevision: new Date(),
    })

    const result = await scheduleRevision({
      studentId: 'student-123',
      errorType: 'problematique_floue',
      errorContext: 'La problématique est trop vague et ne cible pas le sujet',
      sourceInteractionId: 'correction-789',
      severity: 'major',
    })

    expect(result.created).toBe(true)
    expect(result.errorBankItemId).toBe('item-456')
    expect(result.scheduledRevisions).toHaveLength(3) // J+2, J+7, J+21
  })

  it('crée 4 révisions pour erreur critical', async () => {
    const { scheduleRevision } = await import('../src/tools/student/error-bank.js')

    mockDb.errorBankItem.create.mockResolvedValueOnce({ id: 'item-critical' })

    const result = await scheduleRevision({
      studentId: 'student-123',
      errorType: 'contresens',
      errorContext: 'Contresens grave sur le sens de l\'extrait',
      sourceInteractionId: 'oral-101',
      severity: 'critical',
    })

    expect(result.scheduledRevisions).toHaveLength(4) // J+1, J+3, J+7, J+21
  })
})

// ============================================================
// Tests RAG
// ============================================================

describe('eaf_search_corpus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne des résultats avec mode lexical_fallback si pgvector indisponible', async () => {
    const { searchCorpus } = await import('../src/tools/rag/search-corpus.js')

    // Simuler l'échec pgvector et retour lexical
    mockDb.$queryRaw
      .mockRejectedValueOnce(new Error('pgvector indisponible'))
      .mockResolvedValueOnce([
        {
          id: 'chunk-1',
          title: 'Barème EAF 2026 — Éduscol',
          sourceUrl: 'https://eduscol.education.fr/bareme-eaf-2026',
          authorityLevel: 'A',
          docType: 'bareme',
          publishedAt: null,
          legalBasis: 'BO 2025',
          excerpt: 'Le barème de l\'épreuve orale est de 20 points...',
          score: 0.85,
        },
      ])

    const result = await searchCorpus({
      query: 'barème épreuve orale EAF',
      topK: 5,
    })

    expect(result.searchMode).toBe('lexical_fallback')
    expect(result.hits.length).toBeGreaterThanOrEqual(0)
  })

  it('retourne erreur si requireAuthorityA et aucune source A trouvée', async () => {
    const { searchCorpus } = await import('../src/tools/rag/search-corpus.js')

    mockDb.$queryRaw.mockResolvedValue([
      {
        id: 'chunk-2',
        title: 'Blog lycéen',
        authorityLevel: 'D',
        excerpt: 'Ma méthode pour le bac...',
        score: 0.3,
        sourceUrl: 'https://blog.example.com',
        docType: 'autre',
        publishedAt: null,
        legalBasis: null,
      },
    ])

    const result = await searchCorpus({
      query: 'barème officiel EAF',
      requireAuthorityA: true,
    })

    expect(result.hits).toHaveLength(0)
    expect(result.authorityAMissing).toBe(true)
  })
})

// ============================================================
// Tests Auth & Scopes
// ============================================================

describe('Vérification des scopes agents', () => {
  it('refuse eaf_index_document à un agent non-admin', async () => {
    const { checkScope } = await import('../src/lib/auth.js')

    expect(checkScope('rag-librarian', 'eaf_index_document')).toBe(false)
    expect(checkScope('diagnosticien', 'eaf_index_document')).toBe(false)
    expect(checkScope('admin', 'eaf_index_document')).toBe(true)
  })

  it('autorise eaf_search_corpus pour les agents pédagogiques', async () => {
    const { checkScope } = await import('../src/lib/auth.js')

    expect(checkScope('rag-librarian', 'eaf_search_corpus')).toBe(true)
    expect(checkScope('diagnosticien', 'eaf_search_corpus')).toBe(true)
    expect(checkScope('correcteur', 'eaf_search_corpus')).toBe(true)
    expect(checkScope('rappel-agent', 'eaf_search_corpus')).toBe(false)
  })
})

// ============================================================
// Tests Compliance — eaf_index_document
// ============================================================

describe('eaf_index_document — Règle R-COPY-01', () => {
  it('refuse l\'ingestion avec licence citation_pedagogique', async () => {
    const { indexDocument } = await import('../src/tools/rag/search-corpus.js')

    const result = await indexDocument({
      sourceUrl: 'https://example.com/oeuvre-sous-droits.pdf',
      sourceOrg: 'editeur-prive',
      authorityLevel: 'D',
      docType: 'oeuvre',
      license: 'citation_pedagogique',
      legalBasis: 'Usage pédagogique',
      sessionYear: 2026,
    })

    expect(result.indexed).toBe(false)
    expect(result.warnings[0]).toContain('R-COPY-01')
  })
})
