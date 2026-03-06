import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { langueGenerateBodySchema } from '@/lib/validation/schemas';

const FALLBACK_EXERCISES = [
  {
    id: 'static-1',
    sentence: "J'ai vu la mer qui se retirait silencieusement.",
    question: 'Analysez la proposition subordonnée dans cette phrase.',
    correction:
      '« qui se retirait silencieusement » est une proposition subordonnée relative. Elle est introduite par le pronom relatif « qui », ayant pour antécédent le nom « mer ». Elle occupe la fonction de complément de l\'antécédent « mer ».',
    axe: 'syntaxe_complexe',
  },
  {
    id: 'static-2',
    sentence: "Si j'avais su, je ne serais pas venu.",
    question:
      'Quelle est la valeur du mode et du temps employés dans la proposition subordonnée ?',
    correction:
      "La proposition subordonnée de condition « Si j'avais su » est à l'indicatif plus-que-parfait. Elle exprime ici l'irréel du passé : une condition non réalisée dans le passé.",
    axe: 'systeme_verbal',
  },
  {
    id: 'static-3',
    sentence: 'Bien qu\'il fût épuisé, il continua sa route.',
    question: 'Identifiez et analysez le rapport logique exprimé dans cette phrase.',
    correction:
      '« Bien qu\'il fût épuisé » est une proposition subordonnée conjonctive circonstancielle de concession, introduite par la locution conjonctive « bien que » suivie du subjonctif imparfait.',
    axe: 'relations_logiques',
  },
  {
    id: 'static-4',
    sentence: 'Il parlait comme s\'il eût connu la réponse depuis toujours.',
    question: 'Analysez le système verbal de cette phrase.',
    correction:
      '« comme s\'il eût connu » emploie le subjonctif plus-que-parfait à valeur de conditionnel passé 2e forme. Le système hypothétique exprime une comparaison avec un fait irréel.',
    axe: 'systeme_verbal',
  },
  {
    id: 'static-5',
    sentence: 'Je me demande s\'il viendra demain.',
    question: 'Identifiez et analysez la proposition subordonnée.',
    correction:
      '« s\'il viendra demain » est une proposition subordonnée interrogative indirecte totale, introduite par la conjonction « si ». Elle est COD du verbe « demander ».',
    axe: 'syntaxe_complexe',
  },
];

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
    // LLM fallback returned no exercises — serve static defaults
    const count = parsed.data.count;
    const defaults = FALLBACK_EXERCISES.slice(0, count);
    return NextResponse.json(
      { exercises: defaults, fallback: true },
      { status: 200 },
    );
  }

  return NextResponse.json({ exercises: generated.exercises }, { status: 200 });
}
