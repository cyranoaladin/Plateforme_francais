import { describe, expect, it } from 'vitest';
import { formatVisibleCitation, normalizeTutorAnswerFallback } from '@/lib/tutor/visible-citations';

describe('tutor visible citations', () => {
  it('humanise les noms de fichiers hashés et neutralise la source "view"', () => {
    const citation = formatVisibleCitation({
      title: '07b0a74fc1f74540961660751e0a54c5-ra26_lycee_gt_1_francais_graffigny_reportagefrancelumieres.pdf',
      sourceRef: 'view',
      type: 'texte_officiel',
    });

    expect(citation.title).toBe('ra26 lycee gt 1 francais graffigny reportagefrancelumieres');
    expect(citation.source).toBe('ra26 lycee gt 1 francais graffigny reportagefrancelumieres');
  });

  it('remplace le faux message "pas assez de sources" quand des citations existent', () => {
    const normalized = normalizeTutorAnswerFallback(
      "Je n'ai pas assez de sources pour répondre précisément. Reformule ta question en précisant l'œuvre ou le thème.",
      3,
    );

    expect(normalized).toContain('J’ai trouvé des sources utiles');
    expect(normalized).not.toContain("Je n'ai pas assez de sources");
  });
});
