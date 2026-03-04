export type GenerateContentOptions = {
  temperature?: number;
  maxTokens?: number;
  responseMimeType?: 'application/json' | 'text/plain';
  metadata?: Record<string, unknown>;
};

export type GenerateContentResult = {
  text: string;
  content?: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
  };
};

export type ProviderChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface LLMProvider {
  generateContent(
    promptOrMessages: string | ProviderChatMessage[],
    options?: GenerateContentOptions,
  ): Promise<GenerateContentResult>;
  getEmbeddings(text: string): Promise<number[]>;
}

export type LegacySkill = 'diagnosticien' | 'coach_ecrit' | 'planner' | string;

export type LegacyChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LegacyChatOptions = {
  skill: LegacySkill;
};

function normalizeProviderName(raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    return 'gemini';
  }
  return raw.trim().toLowerCase();
}

/**
 * Compat legacy helper used by golden tests.
 * Returns the currently configured provider name.
 */
export function getLlmProvider(): string {
  return normalizeProviderName(process.env.LLM_PROVIDER);
}

/**
 * @deprecated Legacy mock — golden tests only. Production code must use orchestrate() from orchestrator.ts.
 */
function mockResponseForSkill(skill: LegacySkill): string {
  if (skill === 'diagnosticien') {
    return JSON.stringify({
      scores: [10, 12],
      priorities: ["Renforcer l'écrit"],
    });
  }

  if (skill === 'coach_ecrit') {
    return JSON.stringify({
      total: 18,
      criteria: [
        { id: 'problematique', label: 'Problématisation', score: 4 },
        { id: 'plan', label: 'Plan', score: 3 },
        { id: 'citations', label: 'Citations', score: 5 },
        { id: 'expression', label: 'Expression', score: 6 },
      ],
    });
  }

  if (skill === 'planner') {
    return JSON.stringify({
      slots: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      focusAxes: ['ecrit', 'oral'],
    });
  }

  return '{}';
}

/**
 * @deprecated Legacy mock — golden tests only. Production code must use orchestrate() from orchestrator.ts.
 * In `LLM_PROVIDER=mock`, returns deterministic JSON strings by skill.
 */
export async function llmChat(
  _messages: LegacyChatMessage[],
  options: LegacyChatOptions,
): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[DEPRECATED] llmChat() called in production — use orchestrate() instead');
  }

  const provider = getLlmProvider();

  if (provider === 'mock') {
    return mockResponseForSkill(options.skill);
  }

  return '{}';
}
