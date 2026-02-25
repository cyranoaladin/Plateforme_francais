import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetOrCreateSkillMap = vi.fn();
const mockGetLatestWeeklyReport = vi.fn();
const mockGetErrorBankItems = vi.fn();
const mockGetPlan7Days = vi.fn();
const mockSaveWeeklyReport = vi.fn();
const mockGetRouterProvider = vi.fn();
const mockEstimateTokens = vi.fn().mockReturnValue(200);
const mockMcpClient = {
  analytics: {
    getWeeklyStats: vi.fn(),
    getSkillDelta: vi.fn(),
  },
  student: {
    getErrorBank: vi.fn(),
  },
};

const MOCK_SKILL_MAP = {
  studentId: 'stu-1',
  axes: {
    ecrit: [{ microSkillId: 'ecrit_plan', score: 0.6 }],
    oral: [{ microSkillId: 'oral_lecture', score: 0.5 }],
    langue: [],
    oeuvres: [],
    methode: [],
  },
  updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/lib/store/premium-store', () => ({
  getOrCreateSkillMap: (...a: unknown[]) => mockGetOrCreateSkillMap(...a),
  getLatestWeeklyReport: (...a: unknown[]) => mockGetLatestWeeklyReport(...a),
  getErrorBankItems: (...a: unknown[]) => mockGetErrorBankItems(...a),
  getPlan7Days: (...a: unknown[]) => mockGetPlan7Days(...a),
  saveWeeklyReport: (...a: unknown[]) => mockSaveWeeklyReport(...a),
}));

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: (...a: unknown[]) => mockGetRouterProvider(...a),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: (...a: unknown[]) => mockEstimateTokens(...a),
}));

vi.mock('@/lib/mcp', () => ({
  mcpClient: mockMcpClient,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('generateWeeklyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetOrCreateSkillMap.mockResolvedValue(MOCK_SKILL_MAP);
    mockGetLatestWeeklyReport.mockResolvedValue(null);
    mockGetErrorBankItems.mockResolvedValue([]);
    mockGetPlan7Days.mockResolvedValue({ slots: [] });
    mockSaveWeeklyReport.mockResolvedValue(undefined);
    mockMcpClient.analytics.getWeeklyStats.mockRejectedValue(new Error('MCP unavailable'));
    mockMcpClient.analytics.getSkillDelta.mockResolvedValue({});
    mockMcpClient.student.getErrorBank.mockResolvedValue([]);

    mockGetRouterProvider.mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          prediction: 'La dynamique est stable.',
          nextWeekFocus: ['Renforcer les procédés', 'Structurer les introductions'],
        }),
      }),
    });
  });

  it('génère un rapport avec les champs obligatoires', async () => {
    const { generateWeeklyReport } = await import('@/lib/agents/rapport-auto');
    const report = await generateWeeklyReport('stu-1');

    expect(report.id).toBeTruthy();
    expect(report.studentId).toBe('stu-1');
    expect(report.weekLabel).toMatch(/Semaine du/);
    expect(report.generatedAt).toBeTruthy();
    expect(report.skillMapDelta).toBeDefined();
    expect(report.sessionsStats).toBeDefined();
    expect(report.prediction).toBeTruthy();
    expect(report.nextWeekFocus).toBeInstanceOf(Array);
  });

  it("calcule correctement le taux d'adhérence", async () => {
    mockGetPlan7Days.mockResolvedValue({
      slots: [
        { id: '1', completed: true },
        { id: '2', completed: true },
        { id: '3', completed: false },
        { id: '4', completed: false },
      ],
    });

    const { generateWeeklyReport } = await import('@/lib/agents/rapport-auto');
    const report = await generateWeeklyReport('stu-1');

    expect(report.sessionsStats.planned).toBe(4);
    expect(report.sessionsStats.completed).toBe(2);
    expect(report.sessionsStats.adherenceRate).toBe(0.5);
  });

  it('utilise le fallback narrative si le LLM échoue', async () => {
    mockGetRouterProvider.mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('LLM timeout')),
    });

    const { generateWeeklyReport } = await import('@/lib/agents/rapport-auto');
    const report = await generateWeeklyReport('stu-1');

    expect(report.prediction).toBeTruthy();
    expect(report.nextWeekFocus.length).toBeGreaterThan(0);
  });

  it('persiste le rapport via saveWeeklyReport', async () => {
    const { generateWeeklyReport } = await import('@/lib/agents/rapport-auto');
    await generateWeeklyReport('stu-1');
    expect(mockSaveWeeklyReport).toHaveBeenCalledOnce();
  });

  it('ne plante pas si MCP est indisponible', async () => {
    mockMcpClient.analytics.getWeeklyStats.mockRejectedValue(new Error('ECONNREFUSED'));
    const { generateWeeklyReport } = await import('@/lib/agents/rapport-auto');
    await expect(generateWeeklyReport('stu-1')).resolves.toBeDefined();
  });
});
