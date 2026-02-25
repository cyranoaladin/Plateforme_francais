import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDb = {
  evaluation: {
    findMany: vi.fn(),
  },
  memoryEvent: {
    findMany: vi.fn(() => []),
  },
}

vi.mock('../src/lib/db.js', () => ({
  getDb: vi.fn(() => mockDb),
}))

describe('getSkillDelta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calcule le delta entre deux dates', async () => {
    mockDb.evaluation.findMany.mockResolvedValueOnce([
      {
        id: 'eval-1',
        kind: 'quiz',
        score: 12,
        maxScore: 20,
        payload: {
          skillUpdates: [
            { axis: 'ecrit', score: 0.4 },
            { axis: 'oral', score: 0.3 },
          ],
        },
        createdAt: new Date('2026-02-01'),
      },
      {
        id: 'eval-2',
        kind: 'quiz',
        score: 15,
        maxScore: 20,
        payload: {
          skillUpdates: [
            { axis: 'ecrit', score: 0.65 },
            { axis: 'oral', score: 0.45 },
          ],
        },
        createdAt: new Date('2026-02-10'),
      },
    ])

    const { getSkillDelta } = await import('../src/tools/all-tools.js')
    const result = await getSkillDelta({
      studentId: 'student-123',
      fromDate: '2026-02-01',
      toDate: '2026-02-15',
    })

    expect(result.deltas).toHaveLength(2)
    const ecritDelta = result.deltas.find((d: { axis: string }) => d.axis === 'ecrit') as { delta?: number } | undefined
    expect(ecritDelta?.delta).toBeCloseTo(0.25, 1)
    expect(result.strongestImprovement).toBe('ecrit')
    expect(result.overallDelta).toBeGreaterThan(0)
  })

  it('retourne des deltas vides sans évaluations', async () => {
    mockDb.evaluation.findMany.mockResolvedValueOnce([])

    const { getSkillDelta } = await import('../src/tools/all-tools.js')
    const result = await getSkillDelta({
      studentId: 'student-xxx',
      fromDate: '2026-01-01',
    })

    expect(result.deltas).toHaveLength(0)
    expect(result.overallDelta).toBe(0)
  })
})
