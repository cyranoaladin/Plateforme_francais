import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createEpreuve } from '@/lib/epreuves/repository';
import { type EpreuveType } from '@/lib/epreuves/types';
import { orchestrate } from '@/lib/llm/orchestrator';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { epreuveGenerateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/epreuves/generate
 * Body: { type: 'commentaire'|'dissertation'|'contraction_essai', oeuvre?: string, theme?: string }
 * Response: { epreuveId, sujet, texte, consignes, bareme, generatedAt }
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

  const parsed = await parseJsonBody(request, epreuveGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const type = parsed.data.type as EpreuveType;

  const generation = (await orchestrate({
    skill: 'coach_ecrit',
    userId: auth.user.id,
    userQuery: `Génère un sujet de type ${type}. Oeuvre: ${parsed.data.oeuvre ?? 'libre'}. Thème: ${parsed.data.theme ?? 'libre'}.`,
    context:
      'La sortie JSON doit inclure: sujet, texte, consignes (durée 4h, rappel barème), bareme en points sur 20.',
  })) as {
    sujet: string;
    texte: string;
    consignes: string;
    bareme: Record<string, number>;
  };

  const epreuve = await createEpreuve({
    userId: auth.user.id,
    type,
    sujet: generation.sujet,
    texte: generation.texte,
    consignes: generation.consignes,
    bareme: generation.bareme,
  });

  return NextResponse.json(
    {
      epreuveId: epreuve.id,
      sujet: epreuve.sujet,
      texte: epreuve.texte,
      consignes: epreuve.consignes,
      bareme: epreuve.bareme,
      generatedAt: epreuve.generatedAt,
    },
    { status: 200 },
  );
}
