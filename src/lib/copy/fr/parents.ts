export const parentsCopy = {
  shared: {
    comingSoon: 'Espace parents en préparation.',
  },
  dashboard: {
    skillLabels: {
      oral: 'Oral',
      ecrit: 'Écrit',
      grammaire: 'Langue & grammaire',
      lectureCursive: 'Lecture cursive',
    },
    badge: 'Espace parent',
    heroTitle:
      'Le suivi parent doit rendre la progression lisible, sans transformer la maison en salle de classe.',
    heroSummaryPrefix: 'Vue synthétique de',
    heroSummarySuffix:
      ': niveau moyen, axe à resserrer, historique récent et prochaines fenêtres d’épreuve, dans un langage cohérent avec l’EAF.',
    averageCurrent: 'Moyenne actuelle',
    strongestPoint: 'Point fort',
    weekFocus: 'Focus semaine',
    viewPath: 'Voir le parcours',
    openDetailedProfile: 'Ouvrir le profil détaillé',
    statAverage: 'Moyenne',
    statSessions: 'Sessions',
    statStreak: 'Série',
    statWritten: 'Écrit',
    missingExamDate: 'date non renseignée',
    passedExam: 'épreuve passée',
    weeklyAdvice: 'Conseil parental de la semaine',
    quickReadEyebrow: 'Lecture parentale rapide',
    quickReadTitle: 'Les axes de progrès doivent être compréhensibles en moins d’une minute.',
    strongAxis: 'Axe fort',
    strongAxisDetail: 'C’est le registre où la confiance peut servir de levier positif.',
    fragileAxis: 'Axe fragile',
    fragileAxisDetail:
      'Le bon soutien familial consiste surtout à protéger un créneau calme sur cet axe.',
    weeklyAction: 'Action concrète cette semaine',
    trajectoryEyebrow: 'Trajectoire récente',
    trajectoryTitle: 'La tendance hebdomadaire compte plus que l’impression du moment.',
    targetReference: 'Objectif de repère',
    recentEvaluations: 'Évaluations récentes',
    noRecentEvaluations:
      'Aucune évaluation suffisamment récente pour produire une lecture détaillée.',
    weakSignals: 'Signaux faibles',
    noWeakSignals: 'Aucun signal faible fort n’est remonté sur la fenêtre récente.',
    helpfulPositionEyebrow: 'Position parentale utile',
    helpfulPositionTitle: 'Le bon soutien n’est ni le contrôle permanent, ni le retrait total.',
    supportCards: {
      visibleSlotTitle: 'Rendre le créneau visible',
      visibleSlotDetail:
        'Mieux vaut un rendez-vous court mais stable qu’une pression diffuse toute la semaine.',
      namedAxisTitle: 'Nommer l’axe travaillé',
      namedAxisDetail:
        'Demander “quel axe travailles-tu aujourd’hui ?” est souvent plus utile que “tu as révisé ?”.',
      closeLoopTitle: 'Fermer la boucle',
      closeLoopDetail:
        'Après la séance, un retour bref sur ce qui a été fait suffit à consolider l’engagement.',
    },
    parentAdviceBySkill: {
      oral: {
        title: 'Mettre l’oral au centre cette semaine',
        detail:
          'Demander une prise de parole courte mais régulière aide souvent plus qu’un long débrief occasionnel.',
        action: 'Planifier 10 minutes de lecture ou relance orale à heure fixe.',
      },
      ecrit: {
        title: 'Sécuriser la méthode d’écrit',
        detail:
          'Le bon soutien parental ici consiste à stabiliser le cadre de travail, pas à commenter le fond littéraire.',
        action:
          'Prévoir un créneau calme et vérifier seulement que le bloc écrit est réellement lancé.',
      },
      grammaire: {
        title: 'Réduire la dispersion sur la langue',
        detail:
          'Quand la grammaire décroche, il vaut mieux des rappels courts et répétés que des révisions massives.',
        action:
          'Favoriser un exercice ciblé de 5 à 10 minutes plutôt qu’une longue séance diffuse.',
      },
      lectureCursive: {
        title: 'Réactiver les œuvres avant qu’elles ne s’éloignent',
        detail:
          'Le meilleur rôle parental est ici de remettre l’œuvre dans la conversation de façon légère mais régulière.',
        action:
          'Demander un repère, une scène ou une idée-force au lieu d’un résumé intégral.',
      },
    },
    parentAdviceFallback: {
      title: 'Maintenir un rythme régulier',
      detail: 'La stabilité compte plus que les pics d’intensité.',
      action: 'Conserver des créneaux simples et répétables.',
    },
  },
} as const;
