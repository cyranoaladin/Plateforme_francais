import type { StudyPlan } from '@/lib/types/premium';
import { getDueErrorBankItems, saveStudyPlan, getPlan7Days } from '@/lib/store/premium-store';
import { prisma } from '@/lib/db/client';

const PLAN_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export async function getOrRefreshPlan7Days(studentId: string): Promise<StudyPlan> {
  // 1. Vérifier si un plan récent existe
  const raw = await getPlan7Days(studentId);
  const existing = raw && raw.weeks && raw.createdAt && raw.updatedAt
    ? (raw as StudyPlan)
    : null;
  if (existing) {
    const age = Date.now() - new Date(existing.updatedAt).getTime();
    if (age < PLAN_FRESHNESS_MS) {
      return existing;
    }
  }

  // 2. Lire le descriptif de lecture de l'élève pour personnaliser le plan
  const textesDescriptif = await prisma.texteDescriptif.findMany({
    where: { userId: studentId },
    select: { id: true, titreExtrait: true, oeuvreAuteur: true },
    orderBy: { position: 'asc' },
  });
  const descriptifCount = textesDescriptif.length;
  const descriptifComplet = descriptifCount >= 16;

  // 3. Générer un nouveau plan en préservant l'état de complétion des slots existants
  const completedSlotIds = new Set(
    (existing?.slots ?? [])
      .filter((slot) => slot.completed)
      .map((slot) => slot.id),
  );

  const due = await getDueErrorBankItems(studentId);
  const now = new Date().toISOString();

  const revisionSlots = due.slice(0, 3).map((item, index) => ({
    id: `${studentId}-revision-${index + 1}`,
    title: `Révision : ${item.errorType}`,
    type: 'revision' as const,
    objectives: [item.correction],
    completed: completedSlotIds.has(`${studentId}-revision-${index + 1}`),
  }));

  // Slot prioritaire si le descriptif est incomplet
  const descriptifSlot = !descriptifComplet
    ? [{
        id: `${studentId}-slot-descriptif`,
        title: `Compléter le descriptif (${descriptifCount}/16 textes)`,
        type: 'revision' as const,
        objectives: [
          descriptifCount === 0
            ? 'Déposer tes textes étudiés en classe — priorité absolue avant de simuler l\'oral'
            : `Il manque ${16 - descriptifCount} texte(s) — sans descriptif complet la simulation orale reste générique`,
        ],
        completed: completedSlotIds.has(`${studentId}-slot-descriptif`),
      }]
    : [];

  // Objectif de la session orale : générique ou personnalisé selon le descriptif
  const oralObjective = descriptifComplet && textesDescriptif.length > 0
    ? `Simulation explication linéaire sur "${textesDescriptif[0]!.titreExtrait}" (${textesDescriptif[0]!.oeuvreAuteur})`
    : descriptifCount === 0
      ? 'Simuler l\'oral — attention : descriptif vide, textes génériques utilisés'
      : 'Simulation explication linéaire 2/8/2/8';

  const plan: StudyPlan = {
    studentId,
    weeks: [
      {
        week: 1,
        sessions: [
          {
            id: `${studentId}-ecrit-1`,
            type: 'ecrit',
            durationMin: 45,
            objectives: ['Rédiger un commentaire composé complet'],
            completed: completedSlotIds.has(`${studentId}-ecrit-1`),
          },
          {
            id: `${studentId}-oral-1`,
            type: 'oral',
            durationMin: 30,
            objectives: [oralObjective],
            completed: completedSlotIds.has(`${studentId}-oral-1`),
          },
        ],
      },
    ],
    slots: [
      ...descriptifSlot,
      ...revisionSlots,
      {
        id: `${studentId}-slot-std-1`,
        title: 'Quiz méthode',
        type: 'quiz',
        completed: completedSlotIds.has(`${studentId}-slot-std-1`),
      },
      {
        id: `${studentId}-slot-std-2`,
        title: 'Correction courte',
        type: 'ecrit',
        completed: completedSlotIds.has(`${studentId}-slot-std-2`),
      },
    ],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await saveStudyPlan(plan);
  return plan;
}
