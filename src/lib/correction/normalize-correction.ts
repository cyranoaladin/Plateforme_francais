import { type CorrectionJson } from '@/lib/epreuves/types';

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = toNonEmptyString(value);
    return normalized ? [normalized] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') return toNonEmptyString(item);
      if (item && typeof item === 'object') {
        const joined = Object.values(item as Record<string, unknown>)
          .filter((part): part is string => typeof part === 'string')
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' — ');
        return toNonEmptyString(joined);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function inferMention(note: number): string {
  if (note >= 16) return 'Très bien';
  if (note >= 14) return 'Bien';
  if (note >= 12) return 'Assez bien';
  if (note >= 10) return 'Passable';
  return 'Insuffisant';
}

function normalizeAnnotationType(value: unknown): CorrectionJson['annotations'][number]['type'] {
  if (value === 'erreur' || value === 'remarque' || value === 'bravo') {
    return value;
  }
  return 'remarque';
}

function fallbackGlobal(note: number, mention: string): string {
  return `La correction détaillée est partiellement indisponible, mais la copie a bien été traitée. Niveau actuel : ${mention.toLowerCase()} (${note}/20). Reviens sur les rubriques et le conseil final pour préparer la prochaine version.`;
}

export function normalizeCorrectionPayload(raw: unknown): CorrectionJson | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const note = Math.max(0, Math.min(20, toFiniteNumber(source.note, 0)));
  const mention = toNonEmptyString(source.mention) ?? inferMention(note);
  const bilanSource = source.bilan && typeof source.bilan === 'object'
    ? (source.bilan as Record<string, unknown>)
    : null;

  const rubriques = Array.isArray(source.rubriques)
    ? source.rubriques
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item, index) => ({
          titre: toNonEmptyString(item.titre) ?? `Rubrique ${index + 1}`,
          note: Math.max(0, toFiniteNumber(item.note, 0)),
          max: Math.max(1, toFiniteNumber(item.max, 4)),
          appreciation: toNonEmptyString(item.appreciation) ?? 'Analyse détaillée indisponible pour cette rubrique.',
          conseils: (() => {
            const normalized = toStringArray(item.conseils);
            return normalized.length > 0 ? normalized : ['Reprends cette compétence avec un exemple précis de ta copie.'];
          })(),
        }))
    : [];

  const annotations: CorrectionJson['annotations'] = Array.isArray(source.annotations)
    ? source.annotations
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          extrait: toNonEmptyString(item.extrait) ?? 'Extrait non restitué.',
          commentaire: toNonEmptyString(item.commentaire) ?? 'Commentaire indisponible.',
          type: normalizeAnnotationType(item.type),
        }))
    : [];

  const pointsForts = toStringArray(bilanSource?.points_forts);
  const axes = toStringArray(bilanSource?.axes_amelioration);

  return {
    note,
    mention,
    bilan: {
      global: toNonEmptyString(bilanSource?.global) ?? fallbackGlobal(note, mention),
      points_forts: pointsForts.length > 0 ? pointsForts : ['Des éléments pertinents sont présents, mais le détail des points forts n’a pas pu être restitué.'],
      axes_amelioration: axes.length > 0 ? axes : ['Relis les rubriques et refais une tentative en t’appuyant sur le conseil final.'],
    },
    rubriques,
    annotations,
    corrige_type: toNonEmptyString(source.corrige_type) ?? '',
    conseil_final: toNonEmptyString(source.conseil_final) ?? 'Reviens sur les rubriques prioritaires puis soumets une nouvelle copie pour mesurer tes progrès.',
  };
}
