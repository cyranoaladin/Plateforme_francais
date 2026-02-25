import { ZodError } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF } from '@/lib/llm/prompts/system';
import { fallbackSkillOutput, parseSkillOutput, skillPromptFor } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
import { classifyAntiTriche, buildRefusalOutput } from '@/lib/compliance/anti-triche';

type OrchestrateInput = {
  skill: Skill;
  userQuery: string;
  context?: string;
  userId: string;
};

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

export async function orchestrate({ skill, userQuery, context, userId }: OrchestrateInput): Promise<unknown> {
  const compliance = classifyAntiTriche(userQuery);
  if (!compliance.allowed) {
    logger.info({ skill, userId, category: compliance.category }, 'llm.orchestrate.blocked_anti_triche');
    return buildRefusalOutput(compliance);
  }

  const prompt = [
    SYSTEM_PROMPT_EAF,
    `Utilisateur: ${userId}`,
    `Skill: ${skill}`,
    `Instruction skill: ${skillPromptFor(skill)}`,
    'Contexte RAG:',
    context && context.trim().length > 0 ? context : 'Aucun contexte source fourni.',
    'Question élève:',
    userQuery,
  ].join('\n\n');

  try {
    const startedAt = Date.now();
    const provider = getRouterProvider(skill, estimateTokens([{ content: prompt }]));
    const completion = await provider.generateContent(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const parsedRaw = JSON.parse(extractJsonBlock(completion.text)) as unknown;
    logger.info({
      skill,
      userId,
      model: completion.model,
      promptTokens: completion.usage?.promptTokens ?? 0,
      completionTokens: completion.usage?.completionTokens ?? 0,
      latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
      success: true,
    }, 'llm.orchestrate.success');
    return parseSkillOutput(skill, parsedRaw);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error({
        skill,
        issues: error.issues,
        success: false,
      }, 'llm.orchestrate.parse_error');
      return fallbackSkillOutput(skill);
    }

    logger.error({ skill, error, success: false }, 'llm.orchestrate.provider_error');
    return fallbackSkillOutput(skill);
  }
}
