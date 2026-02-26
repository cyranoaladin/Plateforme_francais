import { ZodError } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF, buildRagContextBlock, buildMemoryContextBlock } from '@/lib/llm/prompts/system';
import { fallbackSkillOutput, parseSkillOutput, skillPromptFor } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
import { classifyAntiTriche, buildRefusalOutput } from '@/lib/compliance/anti-triche';
import { validateAgentOutput, sanitizeAgentOutput, NO_EXTERNAL_LINKS_INSTRUCTION } from '@/lib/llm/agent-base';
import { searchOfficialReferences, formatRagContextForPrompt } from '@/lib/rag/search';
import { composeMemoryContext, type AgentType, type MemoryContextOptions } from '@/lib/memory/context-builder';
import { processInteraction, type InteractionEvent } from '@/lib/agents/student-modeler';
import { requirePlan } from '@/lib/billing/gating';

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
  studentId?: string;
  workId?: string;
  parcours?: string;
  /** @deprecated Use auto RAG — only for legacy callers */
  context?: string;
  /** @deprecated Use auto memory — only for legacy callers */
  memoryContext?: string;
};

export type OrchestrateResult = {
  output: unknown;
  skill: Skill;
  ragDocsUsed: number;
  memoryInjected: boolean;
  model?: string;
  latencyMs: number;
  blocked: boolean;
  blockReason?: string;
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

/**
 * Assemble the full system prompt from base + skill + RAG + memory + guardrails.
 */
function assemblePrompt(
  skill: Skill,
  ragContext: string,
  memoryContext: string,
): string {
  const parts: string[] = [
    SYSTEM_PROMPT_EAF,
    `Skill actif: ${skill}`,
    `Instruction skill:\n${skillPromptFor(skill)}`,
    buildRagContextBlock(ragContext),
  ];

  const memBlock = buildMemoryContextBlock(memoryContext);
  if (memBlock) {
    parts.push(memBlock);
  }

  parts.push(NO_EXTERNAL_LINKS_INSTRUCTION);

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

  const rawText = (completion.text ?? completion.content ?? '').trim();
  const validation = validateAgentOutput(rawText);

  if (!validation.valid && attempt <= 1) {
    logger.warn(
      { skill, userId, reason: validation.reason, urls: validation.urls, attempt },
      'llm.orchestrate.output_violation_retrying',
    );
    const reinforcedPrompt = `${prompt}\n\nATTENTION: Ta réponse précédente contenait des URLs ou des références IA. C'est INTERDIT. Reformule.`;
    return callWithValidation(skill, reinforcedPrompt, userQuery, userId, attempt + 1);
  }

  const finalText = validation.valid ? rawText : sanitizeAgentOutput(rawText);

  if (!validation.valid) {
    logger.warn(
      { skill, userId, reason: validation.reason, attempt },
      'llm.orchestrate.output_sanitized_after_retry',
    );
  }

  return {
    text: finalText,
    model: completion.model,
    usage: {
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
