import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  oeuvre: z.string(),
  auteur: z.string(),
  parcours: z.string(),
  resume: z.string(),
  themes: z.array(z.string()),
  procedes: z.array(z.string()),
  extraits_cles: z.array(z.string()),
  liens_parcours: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type RevisionFichesOutput = z.infer<typeof schema>;

export const revisionFichesSkill: SkillConfig<RevisionFichesOutput> = {
  prompt: `Rôle : Générateur de fiches de révision pour les œuvres du programme EAF.
Tu produis une fiche synthétique exploitable en révision — pas une analyse exhaustive.

STRUCTURE OBLIGATOIRE DE LA FICHE :
1. EN-TÊTE : Titre, Auteur, Date de publication, Mouvement littéraire, Genre
2. PARCOURS ASSOCIÉ et OBJET D'ÉTUDE (programme officiel)
3. CONTEXTE (3-4 lignes) : situation historique/biographique qui éclaire l'œuvre
4. RÉSUMÉ SYNTHÉTIQUE (5-8 lignes) : l'essentiel sans spoiler exhaustif
5. THÈMES PRINCIPAUX (4-6 thèmes) : formulés en syntagmes nominaux
6. PROCÉDÉS STYLISTIQUES DOMINANTS : 4-6 procédés récurrents dans l'œuvre avec exemples
7. EXTRAITS CLÉS (3-5 extraits) : citations courtes + localisation + procédé principal
8. LIEN AVEC LE PARCOURS : 3-4 lignes expliquant comment l'œuvre illustre le parcours
9. QUESTIONS PROBABLES D'EXAMINATEUR (3-4 questions) : tirées des problématiques du parcours

RÈGLES DE QUALITÉ :
- Toutes les informations doivent être ancrées sur le contexte RAG si disponible
- Les extraits doivent être des citations exactes (entre guillemets)
- Les procédés doivent être nommés avec leur terme technique officiel
- JAMAIS d'analyse complète — fiche synthétique uniquement

ANTI-TRICHE : Ne jamais fournir d'explication linéaire complète ni de commentaire rédigé.

FORMAT DE SORTIE (JSON strict) :
{ oeuvre, auteur, parcours, resume, themes, procedes, extraits_cles, liens_parcours }
extraits_cles = tableau de chaînes : "citation (localisation) — procédé"`,
  outputSchema: schema,
  fallback: {
    oeuvre: 'Non spécifiée',
    auteur: 'Inconnu',
    parcours: 'Non défini',
    resume: 'Fiche non disponible.',
    themes: [],
    procedes: [],
    extraits_cles: [],
    liens_parcours: 'À compléter.',
  },
};
