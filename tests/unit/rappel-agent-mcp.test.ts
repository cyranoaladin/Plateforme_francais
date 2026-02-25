import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/store/premium-store', () => ({
  getDueErrorBankItems: vi.fn(async () => []),
  recordRevisionAttempt: vi.fn(async () => undefined),
}))

const mockGenerateContent = vi.fn()
vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: vi.fn(() => ({
    generateContent: mockGenerateContent,
  })),
}))

const mockGetErrorBank = vi.fn()
vi.mock('@/lib/mcp', () => ({
  mcpClient: {
    student: {
      getErrorBank: mockGetErrorBank,
    },
    planning: {
      markTaskComplete: vi.fn(async () => ({ marked: true })),
    },
  },
}))

describe('rappel-agent — integration MCP getErrorBank', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lit correctement mcpResult.dueToday', async () => {
    mockGetErrorBank.mockResolvedValueOnce({
      dueToday: [
        {
          id: 'item-1',
          errorType: 'contresens',
          errorContext: 'Contresens sur le texte de Flaubert',
          revisionCount: 0,
          severity: 'major',
        },
      ],
      totalActive: 1,
      totalArchived: 0,
      nextRevisionDate: null,
    })

    mockGenerateContent.mockResolvedValueOnce({
      text: '{"prompt":"Réécris...","expected":"correction"}',
    })

    const { generateDueRevisionExercise } = await import('@/lib/agents/rappel-agent')
    const result = await generateDueRevisionExercise('student-123')

    expect(result.dueCount).toBe(1)
    expect(result.exercise).not.toBeNull()
    expect(result.exercise?.prompt).toContain('Réécris')
  })

  it('utilise le fallback local si MCP est indisponible', async () => {
    mockGetErrorBank.mockRejectedValueOnce(new Error('MCP down'))

    const { generateDueRevisionExercise } = await import('@/lib/agents/rappel-agent')
    const result = await generateDueRevisionExercise('student-123')

    expect(result.dueCount).toBe(0)
    expect(result.exercise).toBeNull()
  })
})
