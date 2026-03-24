import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';

const texteSchema = z.object({
  oeuvre: z.string().trim().min(1).max(200),
  auteur: z.string().trim().min(1).max(160),
  titre: z.string().trim().min(1).max(240),
  objetEtude: z.enum(['poesie', 'roman', 'theatre', 'litterature_idees']),
  type: z.enum(['extrait_oeuvre', 'extrait_parcours']),
});

const bodySchema = z.object({
  textes: z.array(texteSchema).min(1),
  oeuvreChoisie: z.string().trim().min(1).max(200),
});

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce<Record<T, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { textes, oeuvreChoisie } = parsed.data;
  const warnings: string[] = [];

  if (textes.length < 20) {
    warnings.push('Minimum 20 textes non atteint.');
  }

  const byObjet = countBy(textes.map((t) => t.objetEtude));
  for (const objet of ['poesie', 'roman', 'theatre', 'litterature_idees'] as const) {
    if ((byObjet[objet] ?? 0) < 5) {
      warnings.push(`Minimum 5 textes non atteint pour ${objet}.`);
    }
  }

  const byOeuvre = countBy(textes.filter((t) => t.type === 'extrait_oeuvre').map((t) => t.oeuvre));
  for (const [oeuvre, count] of Object.entries(byOeuvre)) {
    if (count < 3) {
      warnings.push(`Minimum de 3 extraits d’œuvre non atteint pour ${oeuvre}.`);
    }
  }

  const byParcours = countBy(textes.filter((t) => t.type === 'extrait_parcours').map((t) => t.oeuvre));
  for (const [oeuvre, count] of Object.entries(byParcours)) {
    if (count < 2) {
      warnings.push(`Minimum de 2 extraits de parcours non atteint pour ${oeuvre}.`);
    }
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'descriptif_save',
      path: '/profil',
      payload: {
        nbTextes: textes.length,
        oeuvreChoisie,
        warnings: warnings.join(' | '),
      },
    }),
  );

  return NextResponse.json(
    {
      ok: true,
      warnings,
      stats: {
        totalTextes: textes.length,
        byObjet,
        byOeuvre,
      },
    },
    { status: 200 },
  );
}
