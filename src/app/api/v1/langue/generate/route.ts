import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { langueGenerateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/langue/generate
 * Body: { theme?: 'subordonnees'|'relations_logiques'|'systeme_verbal'|'mixte', count?: 1-10 }
 * Generates grammar exercises dynamically via LLM.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, langueGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const themeLabels: Record<string, string> = {
    subordonnees: 'propositions subordonnées (relatives, conjonctives, interrogatives indirectes)',
    relations_logiques: 'relations logiques (cause, conséquence, opposition, concession, condition, but)',
    systeme_verbal: 'système verbal (valeurs des temps, subjonctif, conditionnel, concordance)',
    mixte: 'grammaire EAF mixte (subordonnées, relations logiques, système verbal)',
  };
  const theme: string = parsed.data.theme ?? 'mixte';
  const themeLabel = themeLabels[theme] ?? themeLabels['mixte'];

  let result: unknown;
  try {
    result = await orchestrate({
      skill: 'grammaire_ciblee',
      userId: auth.user.id,
      userQuery: `Génère exactement ${parsed.data.count} exercices de grammaire EAF sur le thème : ${themeLabel}.
Pour chaque exercice, donne :
- "id" : identifiant unique (ex: "gram-1")
- "sentence" : une phrase littéraire courte (15-30 mots) tirée d'une œuvre classique ou vraisemblable
- "question" : la question de grammaire officielle portant sur cette phrase
- "correction" : la réponse attendue complète avec terminologie officielle (3-5 phrases)
- "axe" : l'axe grammatical ("syntaxe_complexe", "relations_logiques" ou "systeme_verbal")

FORMAT DE SORTIE (JSON strict) :
{ "exercises": [{ "id": "gram-1", "sentence": "...", "question": "...", "correction": "...", "axe": "..." }], "feedback": "Exercices générés", "score": 0, "max": 2, "points_forts": [], "axes": [] }`,
      context: `Thème: ${parsed.data.theme}. Nombre d'exercices: ${parsed.data.count}. Programme officiel Première EAF.`,
    });
  } catch (err) {
    console.error('[langue/generate] orchestrate error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Impossible de générer les exercices. Réessayez.' },
      { status: 503 },
    );
  }

  const generated = result as {
    exercises?: Array<{
      id: string;
      sentence: string;
      question: string;
      correction: string;
      axe: string;
    }>;
  };

  if (!generated.exercises || generated.exercises.length === 0) {
    return NextResponse.json(
      { error: 'Le générateur n\'a pas pu produire d\'exercices. Réessayez.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ exercises: generated.exercises }, { status: 200 });
}
