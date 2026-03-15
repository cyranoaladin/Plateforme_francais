export const teacherCopy = {
  dashboard: {
    shared: {
      missingValue: '—',
    },
    errors: {
      accessUnavailable: 'Accès enseignant indisponible pour cette session.',
      loadFailed: 'Impossible de charger les données enseignant.',
      unknown: 'Erreur inconnue.',
      classCodeGenerationFailed: 'Échec de génération du code classe.',
      commentSaveFailed: "Échec d'enregistrement du commentaire.",
    },
    status: {
      done: 'Terminée',
      error: 'Erreur',
      processing: 'En traitement',
      pending: 'En attente',
    },
    hero: {
      badge: 'Cockpit enseignant',
      title: 'La vue enseignant doit permettre de piloter la classe, pas de fouiller les données une par une.',
      body:
        'Code classe, niveau moyen, élèves à surveiller, repères de progression, copies corrigées et commentaires: tout doit rester lisible et actionnable depuis un seul écran.',
      primaryCta: 'Générer un code classe',
      secondaryCta: 'Export CSV',
      metrics: {
        classCode: 'Code classe',
        students: 'Élèves',
        classAverage: 'Moyenne classe',
        correctedCopies: 'Copies corrigées',
        undefinedValue: 'Non défini',
      },
      quickReadEyebrow: 'Lecture rapide',
      noCriticalSignal: 'Aucun signal critique immédiat',
      buildRiskTitle: (count: number) => (count > 0 ? `${count} élève${count > 1 ? 's' : ''} à resserrer` : 'Aucun signal critique immédiat'),
      buildUpcomingExamDetail: (date: string) =>
        `Prochaine échéance détectée autour du ${date}. Les commentaires enseignants doivent soutenir cette fenêtre.`,
      noUpcomingExamDetail: 'Aucune prochaine épreuve blanche remontée. Le tableau est centré sur le suivi courant de la classe.',
    },
    loading: 'Chargement du cockpit enseignant...',
    roster: {
      eyebrow: 'Roster classe',
      title: 'Les élèves doivent être lisibles sans perdre la vue d’ensemble.',
      refreshCta: 'Actualiser',
      headers: {
        student: 'Élève',
        email: 'Email',
        score: 'Score',
        lastActivity: 'Dernière activité',
        nextDeadline: 'Prochaine échéance',
      },
      empty: 'Aucun élève rattaché à cette classe pour le moment.',
    },
    distribution: {
      eyebrow: 'Distribution des notes',
      title: 'Une lecture directe de la répartition suffit souvent à orienter la prochaine séquence.',
      buildStudentCount: (count: number) => `${count} élève${count > 1 ? 's' : ''}`,
      empty: 'Aucune distribution disponible tant que les copies corrigées restent absentes.',
    },
    quickActions: {
      eyebrow: 'Pilotage rapide',
      cards: {
        atRisk: {
          title: 'Élèves à soutenir',
          detail: 'Moyenne strictement sous 10/20 dans les données remontées.',
        },
        nextDeadline: {
          title: 'Prochaine échéance',
          detail: 'Première date d’épreuve blanche détectée dans la classe.',
        },
        openCopies: {
          title: 'Copies ouvertes',
          detail: 'Travail restant avant fermeture complète du lot actuel.',
        },
        comments: {
          title: 'Commentaires',
          detail: 'Brouillons de retours enseignants actuellement présents.',
        },
      },
    },
    copies: {
      eyebrow: 'Copies corrigées',
      title: 'Les retours enseignants doivent rester rapides à écrire et simples à relire.',
      buildCount: (count: number) => `${count} copie${count > 1 ? 's' : ''}`,
      noteLabel: 'Note',
      commentPlaceholder: 'Ajouter un commentaire enseignant...',
      studentReadableTag: "Retour ciblé et lisible par l'élève",
      saveCta: 'Enregistrer',
      empty: 'Aucune copie corrigée n’est encore disponible dans ce tableau.',
    },
  },
} as const;
