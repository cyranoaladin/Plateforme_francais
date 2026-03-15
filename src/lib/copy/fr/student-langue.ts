export const studentLangueCopy = {
  generationError: 'Erreur de génération',
  localSeriesTitle: 'Série locale chargée',
  localSeriesDescription: 'Série locale chargée. Une nouvelle sélection a été composée depuis la banque interne.',
  evaluationUnavailable: "Impossible d'évaluer votre réponse pour le moment. Réessayez dans quelques secondes.",
  scorePending: 'En attente',
  themeOptions: {
    mixte: {
      label: 'Mixte',
      eyebrow: 'Rotation complète',
      description: 'Alterne syntaxe, relations logiques et système verbal pour réviser les trois axes du programme.',
    },
    subordonnees: {
      label: 'Subordonnées',
      eyebrow: 'Axe 1',
      description: 'Travaille les relatives, conjonctives, interrogatives indirectes et les fonctions dans la phrase complexe.',
    },
    relations_logiques: {
      label: 'Relations logiques',
      eyebrow: 'Axe 2',
      description: "Cause, conséquence, opposition, concession, but et condition dans des phrases courtes d'oral EAF.",
    },
    systeme_verbal: {
      label: 'Système verbal',
      eyebrow: 'Axe 3',
      description: 'Valeurs des temps, subjonctif, conditionnel et concordance pour sécuriser la réponse de grammaire.',
    },
  },
  page: {
    hero: {
      badge: 'Atelier langue',
      title: 'Un entraînement court pour verrouiller les 2 points de grammaire qui font basculer une prestation orale.',
      body:
        'Nexus compose des phrases-cibles à partir de la banque interne, recentre la terminologie du programme et vous oblige à nommer le fait de langue avant de commenter son effet.',
      metricSeries: 'Série',
      metricActiveAxis: 'Axe actif',
      metricLatestScore: 'Dernière note',
    },
    settings: {
      eyebrow: 'Série de travail',
      title: 'Régler la séance',
      axisLabel: 'Axe du programme',
      reloadLoading: 'Génération...',
      reloadIdle: 'Composer une nouvelle série',
    },
    method: {
      eyebrow: 'Méthode attendue',
      title: "Ce que l'examinateur veut entendre",
      markers: [
        'Identifier le fait de langue exact',
        'Nommer avec la terminologie du programme',
        "Interpréter l'effet dans le contexte",
      ],
    },
    progress: {
      eyebrow: 'Progression',
      validExercisesSuffix: 'exercice(s) valides',
    },
    exercise: {
      eyebrow: 'Phrase cible',
      buildTitle: (current: number, total: number) => `Exercice ${current}/${total}`,
      pendingTitle: 'Atelier en attente',
      terminologyBadge: 'Terminologie EAF première',
      loadingTitle: 'Génération de la série en cours',
      loadingDescription:
        'Nexus compose une petite suite d’exercices sur le thème choisi pour garder un rythme court et exploitable.',
      emptyTitle: 'Aucun exercice disponible',
      emptyDescription: 'Utilisez le composeur de série pour relancer une session sur un axe du programme.',
      sentenceEyebrow: 'Phrase à analyser',
      oralQuestionEyebrow: "Question d'oral",
      analysisEyebrow: 'Votre analyse',
      analysisTitle: "Restez court, exact, exploitable à l'oral",
      analysisFormula: 'Formule : identification, dénomination, interprétation.',
      textareaPlaceholder: 'Rédigez votre analyse grammaticale complète ici...',
      submitLoading: 'Évaluation...',
      submitIdle: 'Soumettre la réponse',
    },
    feedback: {
      eyebrow: 'Retour de séance',
      title: 'Retour sur la réponse',
      missingEyebrow: 'Axes à reprendre',
      correctionEyebrow: 'Correction attendue',
      nextExercise: 'Exercice suivant',
    },
  },
} as const;
