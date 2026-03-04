import { ZodError } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF, buildRagContextBlock, buildMemoryContextBlock } from '@/lib/llm/prompts/system';
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

/**
 * Map Skill → AgentType for memory context builder.
 */
const SKILL_TO_AGENT_TYPE: Partial<Record<Skill, AgentType>> = {
  oral_tirage:          'TIRAGE_ORAL',
  oral_prep30:          'SHADOW_PREP',
  coach_lecture:        'COACH_LECTURE',
  coach_explication:    'COACH_EXPLICATION',
  grammaire_ciblee:     'GRAMMAIRE_CIBLEE',
  oral_entretien:       'ENTRETIEN_OEUVRE',
  oral_bilan_officiel:  'BILAN_ORAL',
  ecrit_diagnostic:     'DIAGNOSTIC_ECRIT',
  pastiche:             'PASTICHE',
  quiz_adaptatif:       'QUIZ_ADAPTATIF',
  examinateur_virtuel:  'EXAMINATEUR_VIRTUEL',
};

export type OrchestrateInput = {
  skill: Skill;
  userQuery: string;
  userId: string;
  oeuvreId?: string;
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

  return parts.join('\n\n');
}

/**
 * Core LLM call with output validation. Returns raw text.
 * Retries once with reinforced constraints if validation fails.
 */
async function callWithValidation(
  skill: Skill,
  prompt: string,
  userQuery: string,
  userId: string,
  attempt = 1,
): Promise<{ text: string; model?: string; usage?: { promptTokens?: number; completionTokens?: number; latencyMs?: number } }> {
  const provider = getRouterProvider(skill, estimateTokens([{ content: prompt }]));
  const startedAt = Date.now();

  const completion = await provider.generateContent(
    [prompt, 'Question élève:', userQuery].join('\n\n'),
    {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  );

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
    },
  };
}

/**
 * Orchestrateur principal — pipeline complet :
 * 1. Anti-triche check
 * 2. Billing check (production only)
 * 3. RAG search (auto, ciblé par workId/parcours)
 * 4. Memory context (auto, ciblé par skill/agentType)
 * 5. LLM call + validation + sanitization
 * 6. Schema validation (Zod)
 * 7. StudentModeler update (async, non-bloquant)
 */
export async function orchestrate(input: OrchestrateInput): Promise<OrchestrateResult> {
  const startedAt = Date.now();
  const effectiveStudentId = input.studentId ?? input.userId;

  // 1. Anti-triche
  const compliance = classifyAntiTriche(input.userQuery);
  if (!compliance.allowed) {
    logger.info({ skill: input.skill, userId: input.userId, category: compliance.category }, 'orchestrate.blocked');
    return {
      output: buildRefusalOutput(compliance),
      skill: input.skill,
      ragDocsUsed: 0,
      memoryInjected: false,
      latencyMs: Date.now() - startedAt,
      blocked: true,
      blockReason: compliance.category,
    };
  }

  // 2. Billing check (non-bloquant en dev)
  if (process.env.NODE_ENV === 'production') {
    try {
      const access = await requirePlan(input.userId, 'tuteurMessagesPerDay');
      if (!access.allowed) {
        return {
          output: { error: 'QUOTA_EXCEEDED', message: 'Limite atteinte. Passez au plan Premium pour continuer.' },
          skill: input.skill,
          ragDocsUsed: 0,
          memoryInjected: false,
          latencyMs: Date.now() - startedAt,
          blocked: true,
          blockReason: 'quota_exceeded',
        };
      }
    } catch (err) {
      logger.warn({ err }, 'orchestrate.billing_check_failed');
    }
  }

  // 3. RAG search automatique (sauf si context pré-fourni par legacy caller)
  let ragContext = input.context ?? '';
  let ragDocsUsed = 0;
  if (!ragContext) {
    try {
      const ragResults = await searchOfficialReferences(
        input.userQuery,
        5,
        { oeuvre: input.workId, parcours: input.parcours },
      );
      ragContext = formatRagContextForPrompt(ragResults);
      ragDocsUsed = ragResults.length;
    } catch (err) {
      logger.warn({ skill: input.skill, err }, 'orchestrate.rag_unavailable');
    }
  }

  // 4. Memory context automatique (sauf si memoryContext pré-fourni)
  let memoryContext = input.memoryContext ?? '';
  let memoryInjected = false;
  if (!memoryContext) {
    try {
      const agentType = SKILL_TO_AGENT_TYPE[input.skill] ?? 'BILAN_ORAL';
      const memOpts: MemoryContextOptions = {
        agentType,
        workId: input.workId,
      };
      // Build a MemoryProfile from SkillMap data
      const { getOrCreateSkillMap } = await import('@/lib/store/premium-store');
      const { estimateGlobalLevel } = await import('@/lib/memory/scoring');
      const skillMap = await getOrCreateSkillMap(effectiveStudentId);
      const axes = Object.values(skillMap.axes).flat();
      const avgScore = axes.length > 0
        ? axes.reduce((s, p) => s + p.score, 0) / axes.length
        : 0.5;
      const profile: import('@/lib/memory/context-builder').MemoryProfile = {
        globalLevel: estimateGlobalLevel(avgScore),
        avgOralScore: null,
        avgEcritScore: null,
        totalSessions: axes.reduce((sum, p) => sum + (p.score > 0 ? 1 : 0), 0),
        weakSkills: [],
        currentWorkMastery: null,
        recentSessionsSummary: null,
      };
      memoryContext = composeMemoryContext(profile, memOpts);
      memoryInjected = memoryContext.length > 0;
    } catch (err) {
      logger.warn({ skill: input.skill, err }, 'orchestrate.memory_unavailable');
    }
  } else {
    memoryInjected = memoryContext.length > 0;
  }

  // 5. LLM call
  const prompt = assemblePrompt(input.skill, ragContext, memoryContext);
  let result: { text: string; model?: string; usage?: Record<string, number> };
  try {
    result = await callWithValidation(input.skill, prompt, input.userQuery, input.userId);
  } catch (err) {
    logger.error({ skill: input.skill, err }, 'orchestrate.provider_error');
    return {
      output: fallbackSkillOutput(input.skill),
      skill: input.skill,
      ragDocsUsed,
      memoryInjected,
      latencyMs: Date.now() - startedAt,
      blocked: false,
    };
  }

  // 6. Schema validation
  let parsedOutput: unknown;
  try {
    const parsedRaw = JSON.parse(extractJsonBlock(result.text)) as unknown;
    parsedOutput = parseSkillOutput(input.skill, parsedRaw);
  } catch (err) {
    if (err instanceof ZodError) {
      logger.error({ skill: input.skill, issues: err.issues }, 'orchestrate.schema_error');
    }
    parsedOutput = fallbackSkillOutput(input.skill);
  }

  // 7. StudentModeler update (async, ne bloque pas la réponse)
  const modelEvent: InteractionEvent = {
    studentId: effectiveStudentId,
    interactionId: `${input.skill}_${Date.now()}`,
    agent: input.skill,
  };
  void processInteraction(modelEvent).catch((err) =>
    logger.warn({ err }, 'orchestrate.student_model_update_failed'),
  );

  logger.info({
    skill: input.skill,
    userId: input.userId,
    model: result.model,
    ragDocsUsed,
    memoryInjected,
    latencyMs: Date.now() - startedAt,
  }, 'orchestrate.success');

  return {
    output: parsedOutput,
    skill: input.skill,
    ragDocsUsed,
    memoryInjected,
    model: result.model,
    latencyMs: Date.now() - startedAt,
    blocked: false,
  };
}
