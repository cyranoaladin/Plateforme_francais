export const studentTuteurCopy = {
  requestFailed: 'Échec de réponse du guidage.',
  technicalError: 'Je rencontre un problème technique. Réessaie dans un instant.',
  page: {
    logoAlt: 'Nexus',
    hero: {
      badge: 'Tuteur Nexus',
      title: 'Un espace pour débloquer une vraie difficulté EAF, pas pour récupérer une réponse générique.',
      body:
        'Pose une question de méthode, d’œuvre, de grammaire ou d’oral. Nexus reformule, recentre, s’appuie sur ton historique utile et propose la prochaine action sans sortir du cadre pédagogique de la plateforme.',
    },
    metrics: {
      guidedAnswers: 'Réponses guidées',
      visibleFollowUps: 'Relances visibles',
      secureFrame: 'Cadre sécurisé',
      secureValue: 'EAF',
    },
    prompts: {
      title: 'Questions qui marchent',
    },
    rules: {
      title: 'Mode opératoire',
      items: {
        framed: {
          title: 'Réponse cadrée EAF',
          body: 'Le tuteur reste sur la méthode, les œuvres, la grammaire et les attendus réels de l’épreuve.',
        },
        sources: {
          title: 'Sources internes',
          body:
            'Les réponses s’appuient sur les références internes mobilisées par la plateforme, pas sur un web ouvert flou.',
        },
        antiCheat: {
          title: 'Anti-copie',
          body:
            'Le guidage aide à produire mieux. Il ne remplace jamais le travail de l’élève par une copie livrée clé en main.',
        },
      },
    },
    conversation: {
      title: 'Conversation guidée',
      subtitle: 'Méthode claire, références internes, aucune URL externe.',
    },
    empty: {
      title: 'Commence par le blocage réel du moment.',
      body:
        'Plus la question est située, plus la réponse devient utile. Exemple : une introduction trop vague, une métaphore mal exploitée, une problématique qui ne tient pas, une question de grammaire mal cadrée.',
    },
    citationsTitle: 'Citations et points d’appui',
    tags: {
      method: 'Méthode',
      works: 'Œuvres',
      grammar: 'Grammaire',
      oral: 'Oral',
    },
    input: {
      label: 'Message au tuteur de parcours',
      placeholder: 'Exemple : ma problématique est trop vague, comment la resserrer ?',
      submitAria: 'Envoyer le message',
    },
    starterPrompts: [
      'Donne-moi une méthode courte pour l’introduction de dissertation.',
      'Comment analyser une métaphore dans un poème de Rimbaud ?',
      'Aide-moi à formuler une problématique sur Manon Lescaut.',
      'Je bloque sur la question de grammaire : comment repartir ?',
    ],
    userLabel: 'Vous',
  },
} as const;
