import { corrigerCopie } from '@/lib/correction/correcteur';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { extractTextFromCopie, isOcrFailureText } from '@/lib/correction/ocr';
import { normalizeCorrectionPayload } from '@/lib/correction/normalize-correction';
import {
  findCopieById,
  findEpreuveById,
  updateCopieStatus,
} from '@/lib/epreuves/repository';
import { processInteraction } from '@/lib/agents/student-modeler';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { resolveCopieAbsolutePath } from '@/lib/storage/copies';

const running = new Set<string>();
const MAX_ATTEMPTS = 3;

export async function processCorrection(copieId: string, attempt = 1, throwOnError = false): Promise<void> {
  let success = false;
  try {
    const copie = await findCopieById(copieId);
    if (!copie) {
      success = true;
      return;
    }

    const epreuve = await findEpreuveById(copie.epreuveId);
    if (!epreuve) {
      await updateCopieStatus({
        copieId,
        status: 'error',
        errorMessage: `Épreuve introuvable pour la copie ${copieId}.`,
      });
      success = true;
      return;
    }

    await updateCopieStatus({ copieId, status: 'processing' });

    const absolutePath = resolveCopieAbsolutePath(copie.filePath);
    const ocrText = await extractTextFromCopie({
      absolutePath,
      mimeType: copie.fileType,
    });

    if (isOcrFailureText(ocrText)) {
      await updateCopieStatus({
        copieId,
        status: 'error',
        ocrText: null,
        errorMessage:
          "Nous n'avons pas réussi à lire automatiquement cette copie. Envoie une image plus nette ou un PDF plus lisible, puis réessaie.",
      });
      success = true;
      return;
    }

    const correction = normalizeCorrectionPayload(await corrigerCopie({
      texteOCR: ocrText,
      sujet: epreuve.sujet,
      typeEpreuve: epreuve.type,
      userId: copie.userId,
    }));

    if (!correction) {
      throw new Error('Correction indisponible après normalisation.');
    }

    await updateCopieStatus({
      copieId,
      status: 'done',
      ocrText,
      correction,
      correctedAt: new Date().toISOString(),
    });

    await createEvaluation({
      userId: copie.userId,
      kind: 'ecrit_blanc',
      score: correction.note,
      maxScore: 20,
      status: 'success',
      payload: {
        copieId,
        epreuveId: copie.epreuveId,
        mention: correction.mention,
        weakSkills: correction.bilan.axes_amelioration,
      },
    }).catch(() => undefined);

    await createMemoryEventRecord(
      createMemoryEvent(copie.userId, {
        type: 'evaluation',
        feature: 'copie_correction_done',
        path: '/atelier-ecrit',
        payload: {
          copieId,
          score: correction.note,
          max: 20,
          weakSkills: correction.bilan.axes_amelioration,
        },
      }),
    ).catch(() => undefined);

    try {
      const rubriques = Array.isArray((correction as { rubriques?: unknown[] }).rubriques)
        ? ((correction as { rubriques: Array<{ titre: string; note: number; max: number; appreciation?: string }> }).rubriques)
        : [];
      await processInteraction({
        studentId: copie.userId,
        interactionId: copieId,
        agent: 'correcteur',
        rubric: {
          criteria: rubriques.map((r) => ({
            id: r.titre.toLowerCase().replace(/ /g, '_'),
            label: r.titre,
            score: r.note,
            max: r.max,
            evidence: r.appreciation,
          })),
        },
      });
    } catch (modelError) {
      logger.warn({ copieId, modelError }, 'epreuves.worker.student_modeler_error');
    }

    success = true;
  } catch (error) {
    if (throwOnError) {
      throw error;
    }

    if (attempt < MAX_ATTEMPTS) {
      const delayMs = Math.pow(2, attempt) * 1000;
      logger.warn(
        { copieId, attempt, delayMs, error },
        'epreuves.worker.retry_scheduled',
      );
      setTimeout(() => {
        void processCorrection(copieId, attempt + 1);
      }, delayMs);
      return;
    }

    logger.error({ copieId, attempt, error }, 'epreuves.worker.dlq_after_max_attempts');
    await updateCopieStatus({
      copieId,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue lors de la correction.',
    });
    if (copieId) {
      const failedCopie = await findCopieById(copieId).catch(() => null);
      if (failedCopie) {
        await createMemoryEventRecord(
          createMemoryEvent(failedCopie.userId, {
            type: 'interaction',
            feature: 'copie_correction_error',
            path: '/atelier-ecrit',
            payload: {
              copieId,
            },
          }),
        ).catch(() => undefined);
      }
    }
  } finally {
    if (success || attempt >= MAX_ATTEMPTS) {
      running.delete(copieId);
    }
  }
}

export function runCorrectionWorker(copieId: string): void {
  if (running.has(copieId)) {
    return;
  }

  running.add(copieId);
  void processCorrection(copieId);
}
