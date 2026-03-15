export const studentEcritCorrectionCopy = {
  loadError: 'Impossible de charger la correction.',
  pendingTitle: "Le rapport de correction est en train d'être composé.",
  exportGuidance: "Le meilleur usage de ce rapport n'est pas de le lire une fois.",
  exportNextStep:
    'Télécharge-le, isole deux axes, puis réinjecte-les dans la prochaine copie ou dans le tuteur.',
  page: {
    pending: {
      badge: 'Rapport en préparation',
      body:
        'La plateforme relit la copie, structure les rubriques, ancre les annotations et prépare un bilan exploitable pour la séance suivante.',
      status: 'Rapport de correction en cours...',
      steps: {
        reading: 'Lecture de la copie...',
        analysis: 'Analyse littéraire...',
        summary: 'Rédaction du bilan...',
      },
    },
    error: "La correction n'a pas pu être générée.",
    hero: {
      badge: 'Rapport de correction',
      title: 'La copie est relue comme un objet de progression, pas comme une simple note finale.',
      body:
        'Rubriques, annotations, corrigé type et lettre finale sont réunis dans un seul écran pour transformer le retour en prochain travail utile.',
    },
    metrics: {
      finalNote: 'Note finale',
      rubrics: 'Rubriques',
      annotations: 'Annotations',
    },
    overview: {
      eyebrow: 'Vue d’ensemble',
      title: 'Bilan global',
      strengths: 'Points forts',
      improvements: 'Axes d’amélioration',
    },
    rubrics: {
      title: 'Rubriques',
    },
    modelAnswer: {
      cta: 'Voir le corrigé type',
    },
    annotations: {
      title: 'Annotations ciblées',
      previewUnavailable: 'Aperçu visuel indisponible pour ce format de copie.',
      active: 'Annotation active',
      imageAlt: 'Copie manuscrite',
    },
    teacherLetter: {
      title: 'Lettre du professeur',
    },
    export: {
      title: 'Exporter et retravailler',
      downloadCta: 'Télécharger mon rapport PDF',
    },
  },
} as const;
