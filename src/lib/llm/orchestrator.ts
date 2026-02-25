import { ZodError } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { logger } from '@/lib/logger';
import { SYSTEM_PROMPT_EAF, buildRagContextBlock, buildMemoryContextBlock } from '@/lib/llm/prompts/system';
import { fallbackSkillOutput, parseSkillOutput, skillPromptFor } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
import { classifyAntiTriche, buildRefusalOutput } from '@/lib/compliance/anti-triche';
import { validateAgentOutput, sanitizeAgentOutput, NO_EXTERNAL_LINKS_INSTRUCTION } from '@/lib/llm/agent-base';

type OrchestrateInput = {
  skill: Skill;
  userQuery: string;
  context?: string;
  memoryContext?: string;
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

/**
 * Assemble the full system prompt from base + skill + RAG + memory + guardrails.
 */
function assemblePrompt(skill: Skill, userId: string, context?: string, memoryContext?: string): string {
  const parts: string[] = [
    SYSTEM_PROMPT_EAF,
    `Utilisateur: ${userId}`,
    `Skill: ${skill}`,
    `Instruction skill:\n${skillPromptFor(skill)}`,
    buildRagContextBlock(context),
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
    const reinforcedPrompt = `${prompt}\n\nATTENTION: Ta réponse précédente contenait des URLs ou des redirections externes. C'est INTERDIT. Reformule sans aucun lien externe.`;
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

export async function orchestrate({ skill, userQuery, context, memoryContext, userId }: OrchestrateInput): Promise<unknown> {
  const compliance = classifyAntiTriche(userQuery);
  if (!compliance.allowed) {
    logger.info({ skill, userId, category: compliance.category }, 'llm.orchestrate.blocked_anti_triche');
    return buildRefusalOutput(compliance);
  }

  const prompt = assemblePrompt(skill, userId, context, memoryContext);

  try {
    const result = await callWithValidation(skill, prompt, userQuery, userId);

    const parsedRaw = JSON.parse(extractJsonBlock(result.text)) as unknown;
    logger.info({
      skill,
      userId,
      model: result.model,
      promptTokens: result.usage?.promptTokens ?? 0,
      completionTokens: result.usage?.completionTokens ?? 0,
      latencyMs: result.usage?.latencyMs ?? 0,
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
