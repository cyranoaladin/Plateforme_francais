import { ZodError } from 'zod';
import {
  recordProviderError,
  recordProviderSuccess,
  selectProvider,
} from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF } from '@/lib/llm/prompts/system';
import { fallbackSkillOutput, parseSkillOutput, skillPromptFor, skillSchemaFor } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
import { classifyAntiTriche, buildRefusalOutput, validateLlmOutput } from '@/lib/compliance/anti-triche';
import { getMediaForAgent, formatMediaContextForPrompt } from '@/data/media-catalog';
import { createAgentInteractionRecord, touchWorkMastery } from '@/lib/db/repositories/learningMemoryRepo';
import { composeMemoryContext, truncateToTokenBudget, type AgentType } from '@/lib/memory/context-builder';
import { loadMemoryProfileForUser } from '@/lib/memory/profile-loader';
import { checkLLMQuota, QuotaExceededError } from '@/lib/security/llm-rate-limiter';
import { trackLlmCall } from '@/lib/llm/cost-tracker';

/** Skills that should NOT receive media context injection */
const SKILLS_WITHOUT_MEDIA: ReadonlySet<Skill> = new Set([
  'oral_tirage',
  'ecrit_baremage',
  'support_produit',
  'correcteur',
  'coach_ecrit',
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

function skillToMemoryAgentType(skill: Skill): AgentType | null {
  const mapping: Partial<Record<Skill, AgentType | null>> = {
    bibliothecaire: null,
    coach_ecrit: 'DIAGNOSTIC_ECRIT',
    coach_oral: 'COACH_EXPLICATION',
    correcteur: 'DIAGNOSTIC_ECRIT',
    quiz_maitre: 'QUIZ_ADAPTATIF',
    tuteur_libre: 'BILAN_ORAL',
    oral_tirage: 'TIRAGE_ORAL',
    coach_lecture: 'COACH_LECTURE',
    coach_explication: 'COACH_EXPLICATION',
    grammaire_ciblee: 'GRAMMAIRE_CIBLEE',
    oral_entretien: 'ENTRETIEN_OEUVRE',
    oral_bilan_officiel: 'BILAN_ORAL',
    ecrit_diagnostic: 'DIAGNOSTIC_ECRIT',
    ecrit_plans: 'DIAGNOSTIC_ECRIT',
    ecrit_contraction: 'DIAGNOSTIC_ECRIT',
    ecrit_essai: 'DIAGNOSTIC_ECRIT',
    ecrit_langue: 'DIAGNOSTIC_ECRIT',
    ecrit_baremage: 'DIAGNOSTIC_ECRIT',
    revision_fiches: 'QUIZ_ADAPTATIF',
    quiz_adaptatif: 'QUIZ_ADAPTATIF',
    spaced_repetition: 'QUIZ_ADAPTATIF',
    oral_prep30: 'SHADOW_PREP',
    citations_procedes: 'DIAGNOSTIC_ECRIT',
    carnet_lecture: 'QUIZ_ADAPTATIF',
    sr_planner: 'QUIZ_ADAPTATIF',
    support_produit: null,
    examinateur_virtuel: 'EXAMINATEUR_VIRTUEL',
    pastiche: 'PASTICHE',
  };

  return mapping[skill] ?? null;
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

function extractSkillSignals(payload: Record<string, unknown>): {
  feedbackScore?: number;
  feedbackMax?: number;
  feedbackLabel?: string;
  strongThemes: string[];
  weakThemes: string[];
  citationsKnown: string[];
} {
  const feedbackScore = typeof payload.score === 'number'
    ? payload.score
    : typeof payload.note === 'number'
      ? payload.note
      : typeof payload.score_langue === 'number'
        ? payload.score_langue
        : undefined;

  const feedbackMax = typeof payload.max === 'number'
    ? payload.max
    : typeof payload.maxNote === 'number'
      ? payload.maxNote
      : typeof payload.max_score === 'number'
        ? payload.max_score
        : typeof payload.maxScore === 'number'
          ? payload.maxScore
          : undefined;

  return {
    feedbackScore,
    feedbackMax,
    feedbackLabel: typeof payload.mention === 'string' ? payload.mention : undefined,
    strongThemes: Array.isArray(payload.points_forts)
      ? payload.points_forts.filter((item): item is string => typeof item === 'string').slice(0, 6)
      : [],
    weakThemes: Array.isArray(payload.axes)
      ? payload.axes.filter((item): item is string => typeof item === 'string').slice(0, 6)
      : [],
    citationsKnown: Array.isArray(payload.citations)
      ? payload.citations
          .map((item) => (item && typeof item === 'object' && 'title' in item ? (item as { title?: unknown }).title : null))
          .filter((item): item is string => typeof item === 'string')
          .slice(0, 8)
      : [],
  };
}

function extractOutputTextForGuardrail(payload: Record<string, unknown>): string {
  if (typeof payload.answer === 'string') {
    return payload.answer;
  }

  if (typeof payload.content === 'string') {
    return payload.content;
  }

  return '';
}

async function persistAgentMemory(input: {
  userId: string;
  skill: Skill;
  userQuery: string;
  prompt: string;
  rawOutput: string;
  context?: string;
  workId?: string;
  parsedOutput?: Record<string, unknown>;
  tokensUsed: number;
  latencyMs: number;
}) {
  const signals = input.parsedOutput ? extractSkillSignals(input.parsedOutput) : null;
  await Promise.allSettled([
    createAgentInteractionRecord({
      userId: input.userId,
      skill: input.skill,
      inputSummary: `${input.userQuery}\n${input.context ?? ''}`.trim(),
      outputSummary: input.rawOutput,
      feedbackScore: signals?.feedbackScore ?? null,
      feedbackLabel: signals?.feedbackLabel ?? null,
      tokensUsed: input.tokensUsed,
      latencyMs: input.latencyMs,
      ragSourcesCount: signals?.citationsKnown.length ?? 0,
    }),
    touchWorkMastery({
      userId: input.userId,
      workId: input.workId,
      normalizedScore: signals?.feedbackScore != null && signals.feedbackMax
        ? Math.max(0, Math.min(1, signals.feedbackScore / signals.feedbackMax))
        : null,
      strongThemes: signals?.strongThemes,
      weakThemes: signals?.weakThemes,
      citationsKnown: signals?.citationsKnown,
    }),
  ]);
}

export async function orchestrate({ skill, userQuery, context, userId, oeuvreId, workId, parcours }: OrchestrateInput): Promise<unknown> {
  const startedAt = Date.now();
  const memoryAgentType = skillToMemoryAgentType(skill);
  const effectiveWorkId = workId ?? oeuvreId;
  
  const compliance = classifyAntiTriche(userQuery);
  if (!compliance.allowed) {
    logger.info({ skill, userId, category: compliance.category }, 'llm.orchestrate.blocked_anti_triche');
    return buildRefusalOutput(compliance);
  }

  // Parallelize memory profile loading and media context (independent operations)
  const [memoryContext, mediaContext] = await Promise.all([
    (async () => {
      if (!memoryAgentType) return '';
      const memoryProfile = await loadMemoryProfileForUser(userId, { workId: effectiveWorkId });
      if (!memoryProfile) return '';
      return truncateToTokenBudget(
        composeMemoryContext(memoryProfile, {
          agentType: memoryAgentType,
          workId: effectiveWorkId,
        }),
      );
    })(),
    Promise.resolve(
      !SKILLS_WITHOUT_MEDIA.has(skill)
        ? formatMediaContextForPrompt(getMediaForAgent(skillToAgentType(skill), effectiveWorkId))
        : '',
    ),
  ]);

  const prompt = [
    SYSTEM_PROMPT_EAF,
    `Utilisateur: ${userId}`,
    `Skill: ${skill}`,
    `Instruction skill: ${skillPromptFor(skill)}`,
    effectiveWorkId ? `WorkId: ${effectiveWorkId}` : '',
    parcours ? `Parcours: ${parcours}` : '',
    '---',
    'Contexte mémoire élève:',
    memoryContext.length > 0 ? memoryContext : 'Aucune mémoire pédagogique exploitable pour cette requête.',
    '---',
    'Contexte RAG:',
    context && context.trim().length > 0 ? context : 'Aucun contexte source fourni.',
    '---',
    mediaContext.length > 0 ? mediaContext : '',
    '---',
    'Question élève:',
    userQuery,
  ].filter(Boolean).join('\n\n');

  const contextTokens = estimateTokens([{ content: prompt }]);
  const selectedProvider = selectProvider({
    skill,
    contextTokens,
  });

  try {
    await checkLLMQuota(userId, skill);

    const completion = await selectedProvider.provider.generateContent(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });
    recordProviderSuccess(selectedProvider.tier);

    const rawText = completion.text;
    const complianceOutput = classifyAntiTriche(rawText);
    if (!complianceOutput.allowed) {
      await trackLlmCall({
        userId,
        skill,
        provider: selectedProvider.providerName,
        model: completion.model ?? selectedProvider.model,
        tier: selectedProvider.tier,
        inputTokens: completion.usage?.promptTokens ?? 0,
        outputTokens: completion.usage?.completionTokens ?? 0,
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
        success: false,
        errorCode: 'ANTI_TRICHE_OUTPUT',
        contextSize: contextTokens,
      });
      void persistAgentMemory({
        userId,
        skill,
        userQuery,
        prompt,
        rawOutput: JSON.stringify(buildRefusalOutput(complianceOutput)),
        context,
        workId: effectiveWorkId,
        tokensUsed: (completion.usage?.promptTokens ?? 0) + (completion.usage?.completionTokens ?? 0),
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
      });
      return buildRefusalOutput(complianceOutput);
    }

    const parsedRaw = JSON.parse(extractJsonBlock(rawText)) as Record<string, unknown>;

    const textToValidate = extractOutputTextForGuardrail(parsedRaw);
    const finalCompliance = validateLlmOutput(textToValidate);
    if (!finalCompliance.allowed) {
      await trackLlmCall({
        userId,
        skill,
        provider: selectedProvider.providerName,
        model: completion.model ?? selectedProvider.model,
        tier: selectedProvider.tier,
        inputTokens: completion.usage?.promptTokens ?? 0,
        outputTokens: completion.usage?.completionTokens ?? 0,
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
        success: false,
        errorCode: 'OUTPUT_VALIDATION',
        contextSize: contextTokens,
      });
      void persistAgentMemory({
        userId,
        skill,
        userQuery,
        prompt,
        rawOutput: JSON.stringify(buildRefusalOutput(finalCompliance)),
        context,
        workId: effectiveWorkId,
        parsedOutput: parsedRaw,
        tokensUsed: (completion.usage?.promptTokens ?? 0) + (completion.usage?.completionTokens ?? 0),
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
      });
      return buildRefusalOutput(finalCompliance);
    }

    const skillSchema = skillSchemaFor(skill);
    const validated = skillSchema.safeParse(parsedRaw);
    if (!validated.success) {
      console.error(`[llm] schema_validation_failure for skill=${skill}`, JSON.stringify(validated.error.format()).slice(0, 300));
      console.error(`[llm] raw output (first 500 chars):`, rawText.slice(0, 500));
      logger.error(
        {
          skill,
          userId,
          error: validated.error.format(),
          rawOutput: rawText.slice(0, 500),
        },
        '[llm] schema_validation_failure',
      );
      await trackLlmCall({
        userId,
        skill,
        provider: selectedProvider.providerName,
        model: completion.model ?? selectedProvider.model,
        tier: selectedProvider.tier,
        inputTokens: completion.usage?.promptTokens ?? 0,
        outputTokens: completion.usage?.completionTokens ?? 0,
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
        success: false,
        errorCode: 'SCHEMA_VALIDATION',
        contextSize: contextTokens,
      });
      const fallback = fallbackSkillOutput(skill);
      void persistAgentMemory({
        userId,
        skill,
        userQuery,
        prompt,
        rawOutput: JSON.stringify(fallback),
        context,
        workId: effectiveWorkId,
        tokensUsed: (completion.usage?.promptTokens ?? 0) + (completion.usage?.completionTokens ?? 0),
        latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
      });
      return fallback;
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

    await trackLlmCall({
      userId,
      skill,
      provider: selectedProvider.providerName,
      model: completion.model ?? selectedProvider.model,
      tier: selectedProvider.tier,
      inputTokens: completion.usage?.promptTokens ?? 0,
      outputTokens: completion.usage?.completionTokens ?? 0,
      latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
      success: true,
      contextSize: estimateTokens([{ content: prompt }]),
    });
    await persistAgentMemory({
      userId,
      skill,
      userQuery,
      prompt,
      rawOutput: JSON.stringify(validated.data),
      context,
      workId: effectiveWorkId,
      parsedOutput: validated.data as Record<string, unknown>,
      tokensUsed: (completion.usage?.promptTokens ?? 0) + (completion.usage?.completionTokens ?? 0),
      latencyMs: completion.usage?.latencyMs ?? (Date.now() - startedAt),
    });

    return parseSkillOutput(skill, validated.data);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      throw error;
    }
    recordProviderError(selectedProvider.tier);
    if (error instanceof SyntaxError) {
      console.error(`[llm] json_parse_error for skill=${skill}:`, error.message);
      logger.error(
        { skill, userId, error: error.message, success: false },
        'llm.orchestrate.json_parse_error',
      );
      await trackLlmCall({
        userId,
        skill,
        provider: selectedProvider.providerName,
        model: selectedProvider.model,
        tier: selectedProvider.tier,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode: 'JSON_PARSE',
        contextSize: contextTokens,
      });
      return fallbackSkillOutput(skill);
    }
    if (error instanceof ZodError) {
      console.error(`[llm] ZodError for skill=${skill}:`, error.issues);
      logger.error({ skill, issues: error.issues, success: false }, 'llm.orchestrate.parse_error');
      await trackLlmCall({
        userId,
        skill,
        provider: selectedProvider.providerName,
        model: selectedProvider.model,
        tier: selectedProvider.tier,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode: 'ZOD_PARSE',
        contextSize: contextTokens,
      });
      return fallbackSkillOutput(skill);
    }
    console.error(`[llm] provider_error for skill=${skill}:`, error instanceof Error ? error.message : error);
    logger.error({ skill, error, success: false }, 'llm.orchestrate.provider_error');
    await trackLlmCall({
      userId,
      skill,
      provider: selectedProvider.providerName,
      model: selectedProvider.model,
      tier: selectedProvider.tier,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      success: false,
      errorCode: error instanceof Error ? error.name || 'PROVIDER_ERROR' : 'PROVIDER_ERROR',
      contextSize: estimateTokens([{ content: prompt }]),
    });
    return fallbackSkillOutput(skill);
  }
}
