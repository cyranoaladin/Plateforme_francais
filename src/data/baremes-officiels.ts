/**
 * Barèmes officiels EAF — Commentaire, Dissertation, Grammaire
 * Source : Échelles descriptives officielles + Note de Service n°2019-042
 *
 * Introduction et conclusion ne sont pas des critères autonomes.
 */

export type NiveauBareme = {
  level: 1 | 2 | 3 | 4;
  description: string;
  points: number;
};

export type CritereBareme = {
  id: string;
  label: string;
  points: number;
  niveaux: readonly NiveauBareme[];
};

export type Bareme = {
  exercice: string;
  total: number;
  criteres: readonly CritereBareme[];
};

export const BAREME_COMMENTAIRE_SERIE_GENERALE = {
  exercice: 'commentaire',
  total: 20,
  criteres: [
    {
      id: 'lecture_analyse_interpretation',
      label: 'Aptitude à lire, à analyser et à interpréter des textes',
      points: 6,
      niveaux: [
        {
          level: 1,
          description:
            "Compréhension très lacunaire, voire fautive du texte. Pas ou très peu d'éléments d'interprétation du sens. Absence de citation ou montage de citations sans analyse.",
          points: 0,
        },
        {
          level: 2,
          description:
            "Compréhension partielle du texte. Des éléments ponctuels d'interprétation du sens. Analyses qui s'appuient sur quelques citations.",
          points: 2,
        },
        {
          level: 3,
          description:
            "Compréhension de la globalité du texte. Éléments d'interprétation justes, mais qui abordent seulement quelques enjeux du texte. Analyses qui s'appuient sur des citations interprétées avec pertinence.",
          points: 4,
        },
        {
          level: 4,
          description:
            "Bonne compréhension du texte dans son sens général et ses nuances. Éléments d'interprétation justes qui mettent en valeur les enjeux principaux du texte. Analyse qui prend en compte différents aspects du texte et qui s'appuie sur des citations pertinentes.",
          points: 6,
        },
      ],
    },
    {
      id: 'construction_reflexion',
      label: 'Aptitude à construire une réflexion en prenant appui sur le texte',
      points: 6,
      niveaux: [
        {
          level: 1,
          description:
            "Projet de lecture absent. Juxtaposition de remarques sans organisation ou simple paraphrase du texte.",
          points: 0,
        },
        {
          level: 2,
          description:
            "Projet de lecture présent, mais mal adapté au texte. Une ébauche d'organisation de la réflexion.",
          points: 2,
        },
        {
          level: 3,
          description:
            "Projet de lecture globalement adapté au texte. Organisation cohérente de la réflexion qui permet d'en suivre le cheminement (présence d'étapes identifiées).",
          points: 4,
        },
        {
          level: 4,
          description:
            "Projet de lecture bien adapté au texte. Réflexion organisée (présence d'étapes identifiées), facile à suivre et qui répond progressivement au projet de lecture.",
          points: 6,
        },
      ],
    },
    {
      id: 'culture_litteraire',
      label: "Aptitude à mobiliser une culture littéraire (vocabulaire d'analyse, connaissances linguistiques, histoire littéraire, genres, objet d'étude…)",
      points: 4,
      niveaux: [
        {
          level: 1,
          description: 'Pas ou très peu de connaissances littéraires.',
          points: 0,
        },
        {
          level: 2,
          description: 'Connaissances littéraires approximatives ou mal exploitées.',
          points: 1,
        },
        {
          level: 3,
          description: "Connaissances littéraires adaptées à l'analyse du texte et correctement exploitées.",
          points: 3,
        },
        {
          level: 4,
          description: "Connaissances littéraires variées mises au service d'une interprétation du texte sur l'ensemble du devoir.",
          points: 4,
        },
      ],
    },
    {
      id: 'maitrise_langue',
      label: "Maîtrise de la langue et de l'expression",
      points: 4,
      niveaux: [
        {
          level: 1,
          description: 'De nombreuses incorrections ou des expressions confuses qui nuisent fortement à la clarté du propos.',
          points: 0,
        },
        {
          level: 2,
          description: "Des maladresses syntaxiques et des incorrections orthographiques et/ou grammaticales qui altèrent par endroits la clarté du propos.",
          points: 1,
        },
        {
          level: 3,
          description: 'Une expression correcte et compréhensible.',
          points: 3,
        },
        {
          level: 4,
          description: "L'expression est satisfaisante et témoigne de précision lexicale ; le devoir est facile à lire.",
          points: 4,
        },
      ],
    },
  ],
} as const satisfies Bareme;

export const BAREME_DISSERTATION = {
  exercice: 'dissertation',
  total: 20,
  criteres: [
    {
      id: 'prise_en_compte_sujet',
      label: 'Prise en compte du sujet',
      points: 4,
      niveaux: [
        {
          level: 1,
          description: "Le candidat n'a pas traité le sujet donné sur l'œuvre.",
          points: 0,
        },
        {
          level: 2,
          description: "Le candidat a partiellement traité le sujet donné sur l'œuvre.",
          points: 1,
        },
        {
          level: 3,
          description: 'Le candidat a globalement traité le sujet.',
          points: 3,
        },
        {
          level: 4,
          description: "Le candidat a bien traité le sujet sur l'œuvre au programme et bien saisi sa portée.",
          points: 4,
        },
      ],
    },
    {
      id: 'construction_reflexion',
      label: "Aptitude à construire une réflexion en prenant en compte d'autres points de vue que le sien",
      points: 8,
      niveaux: [
        {
          level: 1,
          description:
            "Le devoir est une suite de remarques sans structure apparente. Le candidat n'avance pas d'arguments.",
          points: 0,
        },
        {
          level: 2,
          description:
            'Le candidat propose un discours inégalement organisé : il oublie la question à traiter à plusieurs reprises. Le candidat ne développe que de rares arguments.',
          points: 2,
        },
        {
          level: 3,
          description:
            'Le candidat structure son propos pour guider son lecteur : le discours progresse globalement vers une réponse à la question. Le propos du candidat est clairement argumentatif, mais les arguments sont de qualité inégale.',
          points: 5,
        },
        {
          level: 4,
          description:
            "La stratégie argumentative du candidat est maîtrisée. Le discours est tendu vers une réponse claire à la question posée et aux enjeux qu'elle soulève. Les arguments du candidat, par leur pertinence, charpentent la réflexion littéraire engagée.",
          points: 8,
        },
      ],
    },
    {
      id: 'culture_litteraire',
      label: "Aptitude à mobiliser une culture littéraire fondée sur les travaux conduits en cours de français, sur des connaissances et des lectures personnelles",
      points: 4,
      niveaux: [
        {
          level: 1,
          description: "Le propos ne s'appuie sur aucune ou très peu de connaissances précises de l'œuvre.",
          points: 0,
        },
        {
          level: 2,
          description: "L'argumentation du candidat présente des références de l'œuvre au programme, mais leur mise en relation avec le sujet à traiter manque de pertinence.",
          points: 1,
        },
        {
          level: 3,
          description: "L'argumentation présente des références pertinentes, prises dans l'œuvre au programme éventuellement complétées par le parcours associé et les connaissances personnelles du candidat.",
          points: 3,
        },
        {
          level: 4,
          description: "L'argumentation du candidat est nourrie de références littéraires et culturelles pertinentes et bien exploitées. Les références sont prises dans l'œuvre au programme, éventuellement enrichies par le parcours associé et les lectures personnelles.",
          points: 4,
        },
      ],
    },
    {
      id: 'maitrise_langue',
      label: "Maîtrise de la langue et de l'expression",
      points: 4,
      niveaux: [
        {
          level: 1,
          description: "Le candidat s'exprime dans une langue largement incorrecte qui menace l'intelligibilité du texte écrit.",
          points: 0,
        },
        {
          level: 2,
          description: "L'expression du candidat est ponctuellement incorrecte, mais reste globalement intelligible.",
          points: 1,
        },
        {
          level: 3,
          description: "L'expression du candidat est correcte et le lexique adapté.",
          points: 3,
        },
        {
          level: 4,
          description: "L'expression est satisfaisante et témoigne de précision lexicale ; le devoir est facile à lire.",
          points: 4,
        },
      ],
    },
  ],
} as const satisfies Bareme;

export const BAREME_GRAMMAIRE = {
  exercice: 'grammaire',
  total: 2,
  criteres: [
    {
      id: 'analyse_syntaxique',
      label: 'Analyse syntaxique',
      points: 2,
      niveaux: [
        {
          level: 1,
          description: 'Réponse absente, totalement erronée ou aucun raisonnement syntaxique identifiable.',
          points: 0,
        },
        {
          level: 2,
          description: 'Réponse incomplète ou inexacte, raisonnement syntaxique partiel ou approximatif.',
          points: 1,
        },
        {
          level: 3,
          description: "Identification précise de l'unité syntaxique, dénomination correcte et fonction clairement précisée.",
          points: 2,
        },
      ] as const,
    },
  ],
} as const;

export const TOTAUX = {
  commentaire: BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.reduce((sum, critere) => sum + critere.points, 0),
  dissertation: BAREME_DISSERTATION.criteres.reduce((sum, critere) => sum + critere.points, 0),
} as const;

export const BAREMES = {
  commentaire: { criteres: BAREME_COMMENTAIRE_SERIE_GENERALE.criteres, total: TOTAUX.commentaire },
  dissertation: { criteres: BAREME_DISSERTATION.criteres, total: TOTAUX.dissertation },
} as const;

export type ExerciceEcrit = keyof typeof BAREMES;
