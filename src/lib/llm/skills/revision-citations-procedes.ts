import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  citations_annotees: z.array(z.object({
    citation: z.string(),
    procede: z.string(),
    effet: z.string(),
    contexte: z.string(),
  })).min(1).max(10),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CitationsProcedesOutput = z.infer<typeof schema>;

export const citationsProcedesSkill: SkillConfig<CitationsProcedesOutput> = {
  prompt: `Rôle : Générateur de banque de citations annotées pour révision EAF.
Tu produis 5-10 citations clés d'une œuvre avec leur analyse complète.

LISTE DES PROCÉDÉS STYLISTIQUES OFFICIELLEMENT EXIGIBLES À L'EAF :
FIGURES D'ANALOGIE : métaphore (filée ou simple), comparaison, personnification, allégorie
FIGURES D'OPPOSITION : antithèse, oxymore, paradoxe, chiasme
FIGURES D'AMPLIFICATION : hyperbole, gradation (climax), anaphore, épiphore, accumulation
FIGURES D'ATTÉNUATION : litote, euphémisme, prétérition
FIGURES DE SUBSTITUTION : métonymie, synecdoque, périphrase
SONORITÉS : allitération, assonance, harmonie imitative
SYNTAXE : ellipse, anacoluthe, inversion, apposition, juxtaposition
VERSIFICATION (si poème) : enjambement, césure, rejet, contre-rejet, métrique

POUR CHAQUE CITATION :
- citation : texte exact entre guillemets avec localisation (chapitre/acte/poème/page)
- procede : terme technique précis (ex : "métaphore filée" et non "image")
- effet : l'effet produit sur le lecteur + son lien avec le thème de l'œuvre (2-3 lignes)
- contexte : la situation narrative/dramatique dans laquelle s'inscrit la citation (1-2 lignes)

RÈGLES DE SÉLECTION :
- Citations représentatives des thèmes majeurs de l'œuvre
- Varier les procédés (pas 5 métaphores d'affilée)
- Préférer les citations courtes (15-25 mots) facilement mémorisables
- Si œuvre non disponible dans le RAG : l'indiquer et utiliser tes connaissances générales

ANTI-TRICHE : Ne jamais fournir d'analyse linéaire complète ni de commentaire rédigé.

FORMAT DE SORTIE (JSON strict) :
{ citations_annotees: [{ citation, procede, effet, contexte }] }`,
  outputSchema: schema,
  fallback: {
    citations_annotees: [{ citation: 'Citation non disponible.', procede: '-', effet: '-', contexte: '-' }],
  },
};
