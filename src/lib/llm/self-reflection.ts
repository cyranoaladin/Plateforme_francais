import { z } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { logger } from '@/lib/logger';

const ReflectionSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.string()).optional(),
  fixedCorrection: z.string().nullable().optional(),
});

export async function selfReflectCorrection(params: {
  originalCopie: string;
  generatedCorrection: string;
  epreuveType: 'commentaire' | 'dissertation';
  userId?: string;
}): Promise<{ validated: boolean; correction: string; issues?: string[] }> {
  try {
    const messages: ProviderChatMessage[] = [
      {
        role: 'system',
        content: 'Tu es un vérificateur de corrections EAF. Réponds UNIQUEMENT en JSON.',
      },
      {
        role: 'user',
        content: `Analyse cette correction de ${params.epreuveType} et réponds en JSON:
{
  "valid": true/false,
  "issues": ["problèmes éventuels"],
  "fixedCorrection": "version améliorée ou null"
}

CRITÈRES:
- Pas d'inférence émotionnelle
- Pas de rédaction complète à la place de l'élève
- Note cohérente
- Feedback actionnable
- Niveau lycée

COPIE (extrait):
${params.originalCopie.slice(0, 2000)}

CORRECTION:
${params.generatedCorrection}`,
      },
    ];

    const provider = getRouterProvider('self_reflection', estimateTokens(messages));
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error('self_reflection_timeout'));
      }, 15_000);
    });
    const result = await Promise.race([
      provider.generateContent(messages, {
        temperature: 0.1,
        maxTokens: 300,
        responseMimeType: 'application/json',
        metadata: { userId: params.userId, task: 'self_reflection' },
      }),
      timeoutPromise,
    ]);

    const parsed = ReflectionSchema.safeParse(JSON.parse(result.content ?? result.text));
    if (!parsed.success) {
      return { validated: true, correction: params.generatedCorrection };
    }

    if (parsed.data.valid) {
      return { validated: true, correction: params.generatedCorrection };
    }

    if (parsed.data.fixedCorrection && parsed.data.fixedCorrection.trim().length > 0) {
      return {
        validated: false,
        correction: parsed.data.fixedCorrection,
        issues: parsed.data.issues,
      };
    }

    return {
      validated: false,
      correction: params.generatedCorrection,
      issues: parsed.data.issues,
    };
  } catch (error) {
    logger.warn({ route: 'llm/self-reflection', error }, 'self_reflection_failed');
    return { validated: true, correction: params.generatedCorrection };
  }
}
