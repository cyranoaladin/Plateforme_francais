import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { indexerTexteDescriptif, supprimerTexteDescriptifRAG } from '@/lib/rag/indexer';
import { z } from 'zod';

const OBJETS = ['POESIE', 'THEATRE', 'LITTERATURE_IDEES', 'ROMAN_RECIT'] as const;
const TYPES = ['EXTRAIT_OEUVRE', 'EXTRAIT_PARCOURS', 'LECTURE_CURSIVE', 'OEUVRE_CHOISIE_ENTRETIEN'] as const;

const mouvementSchema = z.object({
  debut: z.string().min(1).max(100),
  fin: z.string().min(1).max(100),
  titre: z.string().min(1).max(200),
});

const texteSchema = z.object({
  objetEtude: z.enum(OBJETS),
  typeTexte: z.enum(TYPES),
  oeuvreAuteur: z.string().min(2).max(300),
  oeuvreNom: z.string().max(300).optional(),
  titreExtrait: z.string().min(1).max(500),
  incipit: z.string().max(2000).optional(),
  numeroPagesRef: z.string().max(50).optional(),
  position: z.number().int().min(1).max(30).optional(),
  contenuTexte: z.string().max(50000).optional(),
  parcourAssocie: z.string().max(200).optional(),
  mouvements: z.array(mouvementSchema).max(12).optional(),
  notesPersonnelles: z.string().max(5000).optional(),
});

const bulkUpdateSchema = z.object({
  textes: z.array(texteSchema).min(0).max(30),
});

type ObjetEtude = (typeof OBJETS)[number];
type TypeTexte = (typeof TYPES)[number];

type TexteRow = {
  objetEtude: ObjetEtude;
  typeTexte: TypeTexte;
};

function groupByObjet(textes: TexteRow[]) {
  return OBJETS.map((objetEtude) => ({
    objetEtude,
    extraitsOeuvre: textes.filter((texte) => texte.objetEtude === objetEtude && texte.typeTexte === 'EXTRAIT_OEUVRE').length,
    extraitsParcours: textes.filter((texte) => texte.objetEtude === objetEtude && texte.typeTexte === 'EXTRAIT_PARCOURS').length,
    lecturesCursives: textes.filter((texte) => texte.objetEtude === objetEtude && texte.typeTexte === 'LECTURE_CURSIVE').length,
    oeuvresEntretien: textes.filter((texte) => texte.objetEtude === objetEtude && texte.typeTexte === 'OEUVRE_CHOISIE_ENTRETIEN').length,
  }));
}

function verifierConformite(parObjet: ReturnType<typeof groupByObjet>) {
  return parObjet.map((objet) => ({
    objetEtude: objet.objetEtude,
    conforme: objet.extraitsOeuvre >= 2 && objet.extraitsParcours >= 1 && objet.lecturesCursives >= 1,
    manquant: [
      objet.extraitsOeuvre < 2 ? `${2 - objet.extraitsOeuvre} extrait(s) d'œuvre` : null,
      objet.extraitsParcours < 1 ? '1 texte de parcours associé' : null,
      objet.lecturesCursives < 1 ? '1 lecture cursive' : null,
    ].filter((item): item is string => Boolean(item)),
  }));
}

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const textes = await prisma.texteDescriptif.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ objetEtude: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  const parObjet = groupByObjet(textes);
  const conformite = verifierConformite(parObjet);

  return NextResponse.json({
    textes,
    total: textes.length,
    parObjet,
    conformite,
    estCompletReglementairement: textes.length >= 16 && conformite.every((item) => item.conforme),
  });
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const body = await req.json();
  const parsed = texteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const count = await prisma.texteDescriptif.count({ where: { userId: auth.user.id } });
  if (count >= 30) {
    return NextResponse.json({ error: 'Limite de 30 textes atteinte.' }, { status: 400 });
  }

  const texte = await prisma.texteDescriptif.create({
    data: {
      userId: auth.user.id,
      ...parsed.data,
      position: parsed.data.position ?? count + 1,
    },
  });

  logger.info({ userId: auth.user.id, texteId: texte.id }, 'descriptif.lecture.created');

  // Indexation RAG asynchrone — non-bloquante
  if (texte.contenuTexte && texte.contenuTexte.trim().length > 50) {
    indexerTexteDescriptif({
      texteDescriptifId: texte.id,
      studentId: auth.user.id,
      contenu: texte.contenuTexte,
      metadata: {
        titre: texte.titreExtrait,
        auteur: texte.oeuvreAuteur,
        typeTexte: texte.typeTexte,
        oeuvreNom: texte.oeuvreNom ?? texte.titreExtrait ?? null,
      },
    }).catch((err: unknown) =>
      logger.warn({ texteId: texte.id, err }, 'rag.indexer.descriptif.async_failed')
    );
  }

  return NextResponse.json({ texte }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const body = await req.json();
  const parsed = bulkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Récupérer les IDs existants pour nettoyer le RAG
  const existingIds = await prisma.texteDescriptif.findMany({
    where: { userId: auth.user.id },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.texteDescriptif.deleteMany({ where: { userId: auth.user.id } }),
    prisma.texteDescriptif.createMany({
      data: parsed.data.textes.map((texte, index) => ({
        userId: auth.user.id,
        ...texte,
        position: texte.position ?? index + 1,
      })),
    }),
  ]);

  // Nettoyage RAG asynchrone des anciens textes
  for (const { id } of existingIds) {
    supprimerTexteDescriptifRAG(id).catch((err: unknown) =>
      logger.warn({ texteId: id, err }, 'rag.indexer.descriptif.delete_failed')
    );
  }

  const textes = await prisma.texteDescriptif.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ objetEtude: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  // Ré-indexer les textes avec contenu
  for (const texte of textes) {
    if (texte.contenuTexte && texte.contenuTexte.trim().length > 50) {
      indexerTexteDescriptif({
        texteDescriptifId: texte.id,
        studentId: auth.user.id,
        contenu: texte.contenuTexte,
        metadata: {
          titre: texte.titreExtrait,
          auteur: texte.oeuvreAuteur,
          typeTexte: texte.typeTexte,
          oeuvreNom: texte.oeuvreNom ?? texte.titreExtrait ?? null,
        },
      }).catch((err: unknown) =>
        logger.warn({ texteId: texte.id, err }, 'rag.indexer.descriptif.reindex_failed')
      );
    }
  }

  return NextResponse.json({ textes, total: textes.length });
}
