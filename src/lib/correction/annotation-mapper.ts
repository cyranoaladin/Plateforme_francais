export type CorrectionAnnotation = {
  extrait: string;
  commentaire: string;
  type: 'erreur' | 'remarque' | 'bravo';
};

export type AnnotationRegion = {
  topPct: number;
  heightPct: number;
  leftPct: number;
  widthPct: number;
  confidence: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Heuristic mapping from textual annotation excerpts to approximate
 * vertical regions in the scanned copy image.
 */
export function mapAnnotationsToRegions(
  ocrText: string | null | undefined,
  annotations: CorrectionAnnotation[],
): AnnotationRegion[] {
  const normalizedOcr = normalizeText(ocrText ?? '');
  const ocrLength = normalizedOcr.length;

  return annotations.map((annotation, index) => {
    const excerpt = normalizeText(annotation.extrait);
    const foundAt = excerpt.length > 0 ? normalizedOcr.indexOf(excerpt) : -1;
    const hasMatch = foundAt >= 0 && ocrLength > 0;

    // Spread fallback areas if OCR cannot be matched.
    const fallbackTop = 8 + (index * 11) % 72;
    const matchRatio = hasMatch ? foundAt / Math.max(1, ocrLength) : fallbackTop / 100;
    const topPct = clamp(6 + matchRatio * 82, 4, 92);

    // Longer excerpts occupy more vertical space.
    const rawHeight = excerpt.length > 160 ? 16 : excerpt.length > 80 ? 12 : 9;
    const heightPct = clamp(rawHeight, 7, 22);

    const leftPct = 6 + ((index % 2) * 3);
    const widthPct = 88 - ((index % 3) * 4);

    return {
      topPct,
      heightPct,
      leftPct,
      widthPct,
      confidence: hasMatch ? 0.85 : 0.35,
    };
  });
}
