import { NextResponse } from 'next/server';
import { requireAuthenticatedUser, requireVerifiedEmail } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { createOralSession } from '@/lib/oral/repository';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_CATALOG, PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { consumeQuota, rollbackQuota, QuotaExceededError } from '@/lib/billing/usage';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionStartBodySchema } from '@/lib/validation/schemas';
import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';

function buildPhraseCandidate(text: string): string {
  return text
    .split(/[.!?]/)
    .find((chunk) => chunk.trim().length > 20)
    ?.trim() ?? '';
}

function buildPhraseCandidateForQuestion(contenu: string): string | null {
  // Extraire des phrases de 10-25 mots (longueur idéale pour une question de grammaire)
  const sentences = contenu
    .split(/[.!?;]/)
    .map(s => s.trim())
    .filter(s => {
      const words = s.split(/\s+/).filter(Boolean).length;
      return words >= 8 && words <= 25;
    });
  return sentences[Math.floor(Math.random() * sentences.length)] ?? null;
}

async function choisirExtraitOfficiel(input: {
  userId: string;
  oeuvre: string;
}): Promise<{
  source: 'descriptif' | 'programme';
  texteDescriptifId: string | null;
  oeuvre: string;
  titre: string;
  contenu: string;
  questionGrammaire: string;
  phraseGrammaire: string;
  avertissement?: string;
}> {
  const textesDisponibles = await prisma.texteDescriptif.findMany({
    where: {
      userId: input.userId,
      typeTexte: {
        in: ['EXTRAIT_OEUVRE', 'EXTRAIT_PARCOURS'],
      },
      ...(input.oeuvre
        ? {
            oeuvreAuteur: {
              contains: input.oeuvre,
              mode: 'insensitive',
            },
          }
        : {}),
    },
    orderBy: { position: 'asc' },
  });

  const fallbackPool = textesDisponibles.length > 0
    ? textesDisponibles
    : await prisma.texteDescriptif.findMany({
        where: {
          userId: input.userId,
          typeTexte: {
            in: ['EXTRAIT_OEUVRE', 'EXTRAIT_PARCOURS'],
          },
        },
        orderBy: { position: 'asc' },
      });

  if (fallbackPool.length > 0) {
    const choisi = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    const contenu = choisi.contenuTexte ?? choisi.incipit ?? choisi.titreExtrait;
    return {
      source: 'descriptif',
      texteDescriptifId: choisi.id,
      oeuvre: choisi.oeuvreAuteur,
      titre: choisi.titreExtrait,
      contenu,
      questionGrammaire: (() => {
        const phrase = buildPhraseCandidateForQuestion(contenu);
        return phrase 
          ? `Analysez syntaxiquement le groupe souligné dans : « ${phrase} »`
          : `Analysez syntaxiquement une phrase significative tirée de « ${choisi.titreExtrait} ».`;
      })(),
      phraseGrammaire: buildPhraseCandidate(contenu) || 'Phrase cible indisponible.',
    };
  }

  const corpusMatch = EXTRAITS_OEUVRES.find((item) => item.oeuvre.toLowerCase().includes(input.oeuvre.toLowerCase()))
    ?? EXTRAITS_OEUVRES[0];

  return {
    source: 'programme',
    texteDescriptifId: null,
    oeuvre: corpusMatch?.oeuvre ?? 'Texte du programme',
    titre: corpusMatch?.oeuvre ?? 'Extrait au programme',
    contenu: corpusMatch?.extrait ?? 'Extrait indisponible.',
    questionGrammaire: corpusMatch?.questionGrammaire ?? 'Analysez syntaxiquement une phrase de cet extrait.',
    phraseGrammaire: buildPhraseCandidate(corpusMatch?.extrait ?? '') || 'Phrase cible indisponible.',
    avertissement:
      'Ton descriptif de lecture est vide. Cette simulation utilise un texte générique du programme. Ajoute tes textes étudiés dans "Mon descriptif de lecture" pour simuler les vraies conditions de l’oral.',
  };
}

/**
 * POST /api/v1/oral/session/start
 * Body: { oeuvre, extrait?, questionGrammaire? }
 */
export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await requireAuthenticatedUser();
    if (!auth || errorResponse) {
      return errorResponse;
    }

    // H6: Require verified email before starting oral sessions
    const { errorResponse: emailError } = await requireVerifiedEmail();
    if (emailError) {
      return emailError;
    }

    const csrfError = await validateCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    let billing: Awaited<ReturnType<typeof getBillingContext>>;
    try {
      billing = await getBillingContext(auth.user.id);
    } catch (error) {
      if (error instanceof BillingContextUnavailableError) {
        return NextResponse.json(
          { error: 'La vérification de ton abonnement est momentanément indisponible. Réessaie dans quelques minutes.' },
          { status: 503 },
        );
      }
      throw error;
    }

    const oralQuota = billing.config.quotas.ORAL_SESSIONS;

    const rl = await checkRateLimit({
      request,
      key: `oral:start:${auth.user.id}`,
      limit: billing.config.rateLimits?.oralStartPerHour ?? PLAN_CATALOG[billing.planId].rateLimits.oralStartPerHour,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de démarrages de session orale en peu de temps. Réessaie dans environ 1 heure.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const parsed = await parseJsonBody(request, oralSessionStartBodySchema);
    if (!parsed.success) {
      return parsed.response;
    }

    if (oralQuota) {
      try {
        await consumeQuota(auth.user.id, 'ORAL_SESSIONS', oralQuota);
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          return NextResponse.json(
            {
              error: `Tu as atteint la limite incluse pour l'oral (${err.limit} sessions par ${oralQuota.period === 'day' ? 'jour' : oralQuota.period === 'week' ? 'semaine' : 'mois'}, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Tes données restent en place. Passe au plan supérieur pour relancer une simulation tout de suite.`,
              code: 'QUOTA_EXCEEDED',
              upgradeUrl: '/pricing',
              plan: toPublicPlanId(billing.planId),
              reset_info: getResetMessage(oralQuota.period),
            },
            { status: 402 },
          );
        }
        throw err;
      }
    }

    let selected;
    try {
      selected = await choisirExtraitOfficiel({
        oeuvre: parsed.data.oeuvre,
        userId: auth.user.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sélection de l’extrait';
      logger.error({ err, userId: auth.user.id }, 'oral.start.pickExtrait.error');
      if (oralQuota && oralQuota.limit !== 0) {
        try {
          await rollbackQuota(auth.user.id, 'ORAL_SESSIONS', oralQuota);
        } catch (rollbackError) {
          logger.error({ err: rollbackError, userId: auth.user.id }, 'quota:rollback:failed');
        }
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const texte = parsed.data.extrait ?? selected.contenu;
    const questionGrammaire = parsed.data.questionGrammaire ?? selected.questionGrammaire;
    const phraseGrammaire = selected.phraseGrammaire;
    const oeuvreChoisie = selected.oeuvre;

    try {
      const session = await createOralSession({
        userId: auth.user.id,
        oeuvre: oeuvreChoisie,
        extrait: texte,
        questionGrammaire,
        texteDescriptifId: selected.texteDescriptifId,
        feedback: {
          interactions: [],
          source: selected.source,
          ...(selected.avertissement ? { avertissement: selected.avertissement } : {}),
        },
      });

      if (selected.avertissement) {
        logger.warn({ userId: auth.user.id }, 'oral.session.empty_descriptif');
      }

      try {
        await createMemoryEventRecord(
          createMemoryEvent(auth.user.id, {
            type: 'interaction',
            feature: 'oral_session_start',
            path: '/atelier-oral',
            payload: {
          sessionId: session.id,
          oeuvre: oeuvreChoisie,
          mode: parsed.data.mode ?? 'SIMULATION',
          source: selected.source,
        },
      }),
        );
      } catch (error) {
        logger.warn({ err: error, userId: auth.user.id }, 'oral.start.memoryEvent.failed');
      }

      return NextResponse.json(
        {
          sessionId: session.id,
          texte,
          questionGrammaire,
          phraseGrammaire,
          oeuvreChoisie,
          source: selected.source,
          avertissement: selected.avertissement,
          instructions:
            'Suivez les 4 étapes officielles : lecture (2 min), explication (8 min), grammaire (2 min), entretien (8 min sur l’œuvre choisie).',
        },
        { status: 200 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la session';
      logger.error({ err, userId: auth.user.id }, 'oral.start.createSession.error');
      if (oralQuota && oralQuota.limit !== 0) {
        try {
          await rollbackQuota(auth.user.id, 'ORAL_SESSIONS', oralQuota);
        } catch (rollbackError) {
          logger.error({ err: rollbackError, userId: auth.user.id }, 'quota:rollback:failed');
        }
      }

      return NextResponse.json({ error: `Erreur de création de session : ${message}` }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    logger.error({ err }, 'oral.start.unhandled');
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
