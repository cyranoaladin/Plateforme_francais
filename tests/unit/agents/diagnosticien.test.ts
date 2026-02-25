import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DiagnosticRequest, SkillMap } from '@/lib/types/premium';

const mockSkillMap: SkillMap = {
  studentId: 'stu-1',
  axes: {
    ecrit: [
      { microSkillId: 'ecrit_problematique', score: 0.5 },
      { microSkillId: 'ecrit_plan', score: 0.5 },
      { microSkillId: 'ecrit_citations', score: 0.5 },
      { microSkillId: 'ecrit_expression', score: 0.5 },
    ],
    oral: [
      { microSkillId: 'oral_lecture', score: 0.6 },
      { microSkillId: 'oral_mouvements', score: 0.6 },
      { microSkillId: 'oral_procedes', score: 0.6 },
      { microSkillId: 'oral_entretien', score: 0.6 },
    ],
    langue: [
      { microSkillId: 'langue_phrase_complexe', score: 0.7 },
      { microSkillId: 'langue_relatives', score: 0.7 },
    ],
    oeuvres: [],
    methode: [],
  },
  updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        scores: { ecrit: 0.6, oral: 0.5, langue: 0.7, oeuvres: 0.4, methode: 0.3 },
        priorities: ['Travailler la problématique', 'Réviser les procédés', 'Structurer le plan'],
        risks: ['Manque de citations'],
        plan_summary: 'Plan adapté au mode difficulte',
      }),
    }),
  }),
}));

vi.mock('@/lib/llm/router', () => ({
  selectProvider: vi.fn().mockReturnValue({ providerName: 'mock', tier: 'standard' }),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: vi.fn().mockReturnValue(100),
}));

vi.mock('@/lib/store/premium-store', () => ({
  createDefaultSkillMap: vi.fn().mockReturnValue(mockSkillMap),
  updateSkillMap: vi.fn().mockResolvedValue(mockSkillMap),
  saveStudyPlan: vi.fn().mockResolvedValue(undefined),
  saveDiagnosticResult: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/agents/planner', () => ({
  getOrRefreshPlan7Days: vi.fn().mockResolvedValue({
    studentId: 'stu-1',
    slots: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }),
}));

vi.mock('@/lib/mcp', () => ({
  mcpClient: {
    student: { getProfile: vi.fn().mockResolvedValue({}) },
    evaluation: { saveEvaluation: vi.fn().mockResolvedValue({}) },
    planning: { generatePlan: vi.fn().mockResolvedValue({}) },
  },
}));

describe('runDiagnostic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne un AgentResponse avec skillMap et studyPlan', async () => {
    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const request: DiagnosticRequest = {
      studentId: 'stu-1',
      progressionMode: 'difficulte',
      selfAssessment: { ecrit: 10, oral: 12, langue: 14 },
    };
    const result = await runDiagnostic(request);
    expect(result.skill).toBe('diagnosticien');
    expect(result.status).toBe('ok');
    expect(result.data.skillMap).toBeDefined();
    expect(result.data.studyPlan).toBeDefined();
    expect(result.data.diagnosticResult).toBeDefined();
  });

  it('fonctionne sans sampleWriting (pas d\'appel LLM)', async () => {
    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const { getRouterProvider } = await import('@/lib/llm/factory');
    const request: DiagnosticRequest = {
      studentId: 'stu-2',
      progressionMode: 'objectif_14_plus',
    };
    const result = await runDiagnostic(request);
    expect(result.status).toBe('ok');
    expect(getRouterProvider).not.toHaveBeenCalled();
  });

  it('utilise getRouterProvider("diagnosticien") avec sampleWriting', async () => {
    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const { getRouterProvider } = await import('@/lib/llm/factory');
    const request: DiagnosticRequest = {
      studentId: 'stu-3',
      progressionMode: 'difficulte',
      selfAssessment: { ecrit: 8, oral: 10, langue: 12 },
      sampleWriting: 'Ceci est un échantillon d\'écriture pour le diagnostic...',
    };
    await runDiagnostic(request);
    expect(getRouterProvider).toHaveBeenCalledWith('diagnosticien', expect.any(Number));
  });

  it('persiste via saveDiagnosticResult', async () => {
    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const { saveDiagnosticResult } = await import('@/lib/store/premium-store');
    const request: DiagnosticRequest = {
      studentId: 'stu-4',
      progressionMode: 'fort_desorganise',
      selfAssessment: { ecrit: 15, oral: 14, langue: 16 },
    };
    await runDiagnostic(request);
    expect(saveDiagnosticResult).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 'stu-4' }),
    );
  });

  it('ne plante pas si MCP est indisponible', async () => {
    const { mcpClient } = await import('@/lib/mcp');
    vi.mocked(mcpClient.student.getProfile).mockRejectedValue(new Error('MCP down'));
    vi.mocked(mcpClient.evaluation.saveEvaluation).mockRejectedValue(new Error('MCP down'));
    vi.mocked(mcpClient.planning.generatePlan).mockRejectedValue(new Error('MCP down'));

    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const request: DiagnosticRequest = {
      studentId: 'stu-5',
      progressionMode: 'oral_prioritaire',
    };
    const result = await runDiagnostic(request);
    expect(result.status).toBe('ok');
  });

  it('génère un studyPlan de 6 semaines × 3 sessions', async () => {
    const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
    const request: DiagnosticRequest = {
      studentId: 'stu-6',
      progressionMode: 'difficulte',
      selfAssessment: { ecrit: 10, oral: 10, langue: 10 },
    };
    const result = await runDiagnostic(request);
    const plan = result.data.studyPlan as { weeks: Array<{ sessions: unknown[] }> };
    expect(plan.weeks).toHaveLength(6);
    for (const week of plan.weeks) {
      expect(week.sessions).toHaveLength(3);
    }
  });
});

describe('generateStudyPlan — modes de progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['difficulte', 'objectif_14_plus', 'fort_desorganise', 'oral_prioritaire'])(
    'mode "%s" génère 6 semaines × 3 sessions',
    async (mode) => {
      const { runDiagnostic } = await import('@/lib/agents/diagnosticien');
      const result = await runDiagnostic({
        studentId: `stu-mode-${mode}`,
        progressionMode: mode,
        selfAssessment: { ecrit: 10, oral: 10, langue: 10 },
      });
      const plan = result.data.studyPlan as { weeks: Array<{ sessions: unknown[] }> };
      expect(plan.weeks).toHaveLength(6);
      for (const week of plan.weeks) {
        expect(week.sessions).toHaveLength(3);
      }
    },
  );
});
