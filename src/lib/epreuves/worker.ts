import { corrigerCopie } from '@/lib/correction/correcteur';
import { extractTextFromCopie } from '@/lib/correction/ocr';
import {
  findCopieById,
  findEpreuveById,
  updateCopieStatus,
} from '@/lib/epreuves/repository';
import { processInteraction } from '@/lib/agents/student-modeler';
import { logger } from '@/lib/logger';
import { resolveCopieAbsolutePath } from '@/lib/storage/copies';

const running = new Set<string>();

export function runCorrectionWorker(copieId: string): void {
  if (running.has(copieId)) {
    return;
  }

  running.add(copieId);

  void (async () => {
    try {
      const copie = await findCopieById(copieId);
      if (!copie) {
        return;
      }

      const epreuve = await findEpreuveById(copie.epreuveId);
      if (!epreuve) {
        await updateCopieStatus({ copieId, status: 'error' });
        return;
      }

      await updateCopieStatus({ copieId, status: 'processing' });

      const absolutePath = resolveCopieAbsolutePath(copie.filePath);
      const ocrText = await extractTextFromCopie({
        absolutePath,
        mimeType: copie.fileType,
      });

      const correction = await corrigerCopie({
        texteOCR: ocrText,
        sujet: epreuve.sujet,
        typeEpreuve: epreuve.type,
        userId: copie.userId,
      });

      await updateCopieStatus({
        copieId,
        status: 'done',
        ocrText,
        correction,
        correctedAt: new Date().toISOString(),
      });

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
    } catch (error) {
      logger.error({ copieId, error }, 'epreuves.worker.error');
      await updateCopieStatus({ copieId, status: 'error' });
    } finally {
      running.delete(copieId);
    }
  })();
}
