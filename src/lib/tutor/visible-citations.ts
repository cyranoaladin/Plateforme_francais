import type { RagSearchResult } from '@/lib/rag/search';

function sanitizeVisibleCitationText(value: string | null | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();

  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('/data/') ||
    lower.startsWith('/tmp/') ||
    lower.startsWith('file:')
  ) {
    return normalized.split('/').filter(Boolean).pop() ?? '';
  }

  return normalized;
}

function humanizeFilenameLikeLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const basename = trimmed.split('/').filter(Boolean).pop() ?? trimmed;
  const withoutHash = basename.replace(/^[a-f0-9]{16,}-/i, '');
  const withoutDoubleExt = withoutHash.replace(/(\.[a-z0-9]{2,5})\1$/i, '$1');
  const withoutExt = withoutDoubleExt.replace(/\.[a-z0-9]{2,5}$/i, '');
  const spaced = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!spaced) {
    return '';
  }

  return spaced
    .replace(/\bpdf\b/gi, '')
    .replace(/\bview\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSourceLabel(source: string, title: string) {
  const cleaned = sanitizeVisibleCitationText(source);
  if (!cleaned || cleaned.toLowerCase() === 'view') {
    return title || 'Source pédagogique';
  }

  const humanized = humanizeFilenameLikeLabel(cleaned);
  return humanized || title || 'Source pédagogique';
}

export function formatVisibleCitation(ref: Pick<RagSearchResult, 'title' | 'sourceRef' | 'type'>) {
  const rawTitle = sanitizeVisibleCitationText(ref.title);
  const humanTitle = humanizeFilenameLikeLabel(rawTitle) || rawTitle;
  const fallbackTitle =
    humanTitle ||
    (ref.type === 'texte_officiel' ? 'Texte officiel' : 'Source pédagogique');

  return {
    title: fallbackTitle,
    source: normalizeSourceLabel(ref.sourceRef, fallbackTitle),
  };
}

export function normalizeTutorAnswerFallback(answer: string | undefined, citationCount: number) {
  const trimmed = (answer ?? '').trim();
  if (!trimmed) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (citationCount > 0 && lower.includes("je n'ai pas assez de sources")) {
    return 'J’ai trouvé des sources utiles, mais la réponse générée n’était pas assez fiable. Reformule ta question en citant l’œuvre, le passage ou le thème précis à analyser.';
  }

  return trimmed;
}
