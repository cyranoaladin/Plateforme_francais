import { ZodError } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF } from '@/lib/llm/prompts/system';
import { fallbackSkillOutput, parseSkillOutput, skillPromptFor } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
import { classifyAntiTriche, buildRefusalOutput, validateLlmOutput } from '@/lib/compliance/anti-triche';
import { getMediaForAgent, formatMediaContextForPrompt } from '@/data/media-catalog';
import type { AgentType } from '@/lib/memory/context-builder';

/** Skills that should NOT receive media context injection */
const SKILLS_WITHOUT_MEDIA: ReadonlySet<Skill> = new Set([
  'oral_tirage',
  'ecrit_baremage',
  'support_produit',
  'correcteur',
]);

export type OrchestrateInput = {
  skill: Skill;
  userQuery: string;
  userId: string;
  oeuvreId?: string;
  context?: string;
  workId?: string;
  parcours?: string;
};

/** Maps a Skill to the closest AgentType for media filtering */
function skillToAgentType(skill: Skill): AgentType {
  const mapping: Partial<Record<Skill, AgentType>> = {
    coach_oral: 'COACH_EXPLICATION',
    oral_tirage: 'TIRAGE_ORAL',
    coach_lecture: 'COACH_LECTURE',
    coach_explication: 'COACH_EXPLICATION',
    grammaire_ciblee: 'GRAMMAIRE_CIBLEE',
    oral_entretien: 'ENTRETIEN_OEUVRE',
    oral_bilan_officiel: 'BILAN_ORAL',
    ecrit_diagnostic: 'DIAGNOSTIC_ECRIT',
    pastiche: 'PASTICHE',
    quiz_adaptatif: 'QUIZ_ADAPTATIF',
    examinateur_virtuel: 'EXAMINATEUR_VIRTUEL',
    oral_prep30: 'SHADOW_PREP',
  };
  return mapping[skill] ?? 'COACH_EXPLICATION';
}

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

export async function orchestrate({ skill, userQuery, context, userId, oeuvreId }: OrchestrateInput): Promise<unknown> {
  const startedAt = Date.now();
  
  const compliance = classifyAntiTriche(userQuery);
  if (!compliance.allowed) {
    logger.info({ skill, userId, category: compliance.category }, 'llm.orchestrate.blocked_anti_triche');
    return buildRefusalOutput(compliance);
  }

  // Build media context only for skills that benefit from it
  let mediaContext = '';
  if (!SKILLS_WITHOUT_MEDIA.has(skill)) {
    const agentType = skillToAgentType(skill);
    const mediaEntries = getMediaForAgent(agentType, oeuvreId);
    mediaContext = formatMediaContextForPrompt(mediaEntries);
  }

  const prompt = [
    SYSTEM_PROMPT_EAF,
    `Utilisateur: ${userId}`,
    `Skill: ${skill}`,
    `Instruction skill: ${skillPromptFor(skill)}`,
    '---',
    'Contexte RAG:',
    context && context.trim().length > 0 ? context : 'Aucun contexte source fourni.',
    '---',
    mediaContext.length > 0 ? mediaContext : '',
    '---',
    'Question élève:',
    userQuery,
  ].filter(Boolean).join('\n\n');

  try {
    const provider = getRouterProvider(skill, estimateTokens([{ content: prompt }]));
    const completion = await provider.generateContent(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const rawText = completion.text;
    const complianceOutput = classifyAntiTriche(rawText);
    if (!complianceOutput.allowed) {
      return buildRefusalOutput(complianceOutput);
    }

    const parsedRaw = JSON.parse(extractJsonBlock(rawText)) as Record<string, unknown>;

    const textToValidate = String(parsedRaw.answer ?? parsedRaw.feedback ?? parsedRaw.content ?? '');
    const finalCompliance = validateLlmOutput(textToValidate);
    if (!finalCompliance.allowed) {
      return buildRefusalOutput(finalCompliance);
    }

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
      logger.error({ skill, issues: error.issues, success: false }, 'llm.orchestrate.parse_error');
      return fallbackSkillOutput(skill);
    }
    logger.error({ skill, error, success: false }, 'llm.orchestrate.provider_error');
    return fallbackSkillOutput(skill);
  }
}
