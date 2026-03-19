export const publicPricingPageCopy = {
  header: {
    logoAlt: 'Nexus Réussite',
    plansBadge: 'Plans 2026',
    loginCta: 'Se connecter',
    registerCta: 'Commencer gratuitement',
  },
  hero: {
    badge: 'Tarification claire, sans promesse floue',
    titleLead: 'Choisis le bon rythme de travail,',
    titleAccent: 'puis laisse le produit faire le reste.',
    body:
      'Compare les plans, comprends les quotas, vois les alternatives de paiement et décide seulement après avoir compris ce que chaque niveau débloque vraiment.',
    primaryCta: 'Voir les plans',
    secondaryCta: 'Créer un compte gratuit',
    chips: [
      'Aucun paiement avant essai',
      'Virement bancaire actif',
      'Carte bientôt disponible',
      'Flouci bientôt disponible',
    ],
  },
  status: {
    planLabels: {
      FREE: 'Free',
      PREMIUM: 'Premium',
      PRO: 'Pro',
    },
    eyebrow: 'Ton statut',
    title: 'Une facturation lisible, même avant paiement.',
    currencyBadge: 'Facturation en TND',
    loading: 'Chargement du statut...',
    visitorLabel: 'Mode visiteur',
    visitorTitle: 'Aucun compte connecté',
    visitorBody:
      'Tu peux comparer les plans librement. Le compte gratuit n’intervient qu’au moment utile, pas avant.',
    activePlanLabel: 'Plan actif',
    statusLabel: 'Statut',
    defaultStatus: 'ACTIVE',
    dueDateLabel: 'Échéance',
    lastPaymentLabel: 'Dernier paiement',
    referenceLabel: 'Ref.',
    noPaymentRequiredTitle: 'Aucun paiement requis pour commencer',
    noPaymentRequiredBody:
      'Le plan Free permet déjà de tester l’onboarding, les premiers ateliers et la logique du produit.',
    noRecentPayment: 'Aucun paiement récent enregistré.',
    currencyMethodsLabel: 'Devise et moyens de paiement',
    currencyMethodsBody:
      'Facturation en TND. Virement bancaire actif. Carte et Flouci bientôt disponibles.',
    currencyChip: 'TND',
    unavailable: 'Impossible de charger votre statut de facturation.',
  },
  plans: {
    eyebrow: 'Plans',
    title: 'Trois rythmes, trois plafonds, une seule logique de valeur.',
    body:
      'Le but n’est pas de noyer l’offre. Il est de rendre le choix simple, défendable et rapide pour l’élève comme pour le parent qui paie.',
    recommendedBadge: 'Recommandé',
    redirecting: 'Redirection...',
    guestFreeCta: 'Créer mon compte gratuit',
    guestPaidCta: 'Commencer — créer un compte',
    offers: [
      {
        id: 'FREE',
        title: 'Free',
        priceTND: '0 TND',
        period: '',
        bullets: [
          '1 session orale / mois',
          '2 corrections écrites / mois',
          '3 échanges guidés / jour',
          'Échantillon de bibliothèque',
        ],
        cta: 'Découvrir gratuitement',
        ctaDisabledLabel: 'Plan actuel',
        checkoutPlan: null,
        highlighted: false,
        kicker: 'Aperçu du produit',
        note:
          'Un accès limité pour juger la qualité du workflow avant de s\u2019engager.',
      },
      {
        id: 'PREMIUM',
        title: 'Premium',
        priceTND: '99 TND',
        period: '/ mois',
        bullets: [
          '10 sessions orales / semaine',
          '20 corrections écrites / mois',
          '100 échanges guidés / jour',
          'OCR 20 copies / mois',
          'Parcours personnalisé',
          'Rapport PDF oral',
          'Bibliothèque complète',
        ],
        cta: 'Passer à Premium',
        ctaDisabledLabel: 'Plan actuel',
        checkoutPlan: 'PREMIUM',
        highlighted: true,
        kicker: 'Rythme régulier',
        note:
          'Le meilleur point d’équilibre quand tu travailles chaque semaine et que tu veux supprimer les plafonds trop vite atteints.',
      },
      {
        id: 'PRO',
        title: 'Pro',
        priceTND: '129 TND',
        period: '/ mois',
        bullets: [
          'Oral illimité',
          'Corrections écrites illimitées',
          'Accompagnement guidé illimité',
          'OCR 50 copies / mois',
          'Capacité de traitement 200k / jour',
          'Graph RAG avancé',
          'Historique oral complet',
          'Support prioritaire',
        ],
        cta: 'Passer à Pro',
        ctaDisabledLabel: 'Plan actuel',
        checkoutPlan: 'PRO',
        highlighted: false,
        kicker: 'Tout illimité',
        note: 'Conçu pour les usages intensifs et ceux qui veulent zéro limite sur les quotas.',
      },
    ],
  },
  decision: {
    eyebrow: 'Aide à la décision',
    title: 'La bonne offre dépend du rythme, pas d’un argument marketing vide.',
    guides: [
      {
        title: 'Free',
        body:
          'Tu veux vérifier la qualité du workflow, lancer l’onboarding et juger le produit avant toute dépense.',
      },
      {
        title: 'Premium — 99 TND/mois',
        body:
          'Tu travailles chaque semaine et tu veux une plateforme assez solide pour soutenir le rythme sans tomber vite sur les limites.',
      },
      {
        title: 'Pro — 129 TND/mois',
        body:
          'Tu veux travailler sans plafond sur la durée et garder la marge maximale sur l’oral, l’écrit et le quiz.',
      },
    ],
  },
  activation: {
    eyebrow: 'Activation',
    title: 'Activer avec un code',
    body:
      'Si un code d’activation t’a été envoyé, active ton plan ici sans repasser par le checkout ni ressaisir un paiement.',
    placeholder: 'NEXUS-PRO-XXXX-XXXX',
    loading: 'Activation...',
    cta: 'Activer',
    loginFirstPrefix: 'Connecte-toi d’abord',
    loginFirstSuffix: 'pour rattacher le code à ton compte, puis reviens ici pour l’activer.',
  },
  alternativePayment: {
    eyebrow: 'Paiement alternatif',
    title: 'Commander un code en Tunisie',
    body:
      'Si la carte bancaire n’est pas le bon canal, la page propose un lien Flouci et un virement bancaire avec activation manuelle du plan.',
    flouciTitle: 'Paiement Flouci',
    flouciBody:
      'Wallet, carte ou e-Dinar via Flouci si ce canal correspond mieux à votre contexte. Le lien de paiement et la validation manuelle passent ensuite par l’équipe Nexus.',
    flouciSubject: 'Paiement Flouci Nexus Réussite',
    viewFlouci: 'Voir Flouci',
    requestFlouciLink: 'Demander un lien Flouci',
    flouciHint:
      'Utilisez l’email du compte ou votre identifiant utilisateur dans la demande pour accélérer l’activation.',
    bankTransferTitle: 'Virement bancaire',
    bankTransferBody:
      'Ajoutez l’email du compte ou l’identifiant utilisateur en motif. Le plan est activé après vérification du règlement.',
    bankTransferSubject: 'Confirmation de virement Nexus Réussite',
    sendReference: 'Envoyer la référence',
    summary:
      'Facturation en dinar tunisien. Premium = 99 TND/mois. Pro = 129 TND/mois. Le code d’activation est envoyé après confirmation si vous utilisez Flouci ou le virement.',
    bankTransferRows: [
      { label: 'Identifiant', value: '871456' },
      { label: 'Titulaire', value: 'STE M&M ACADEMY SUARL' },
      { label: 'Nature du compte', value: 'COMPTES CHEQUES ENTREPRISES' },
      { label: 'RIB', value: 'RIB25079000000156908404' },
      { label: 'IBAN', value: 'TN5925079000000156908404' },
      { label: 'BIC', value: 'BZITTNTT' },
    ],
    flouciRequestBody:
      'Bonjour,\r\nJe souhaite régler mon abonnement Nexus via Flouci.\r\nMon email de compte : \r\nMon identifiant utilisateur (si connu) : \r\nPlan souhaité : Premium / Pro',
    bankTransferMailBody:
      'Bonjour,\r\nJe vous envoie la référence de mon virement pour activation.\r\nEmail du compte : \r\nIdentifiant utilisateur (si connu) : \r\nPlan réglé : Premium / Pro\r\nRéférence du virement : ',
  },
  comparison: {
    eyebrow: 'Comparaison détaillée',
    title: 'Les quotas sont visibles, donc la décision reste rationnelle.',
    chip: 'Compare en 30 secondes',
    columns: {
      feature: 'Fonctionnalité',
      free: 'Free',
      premium: 'Premium',
      pro: 'Pro',
    },
    featureRows: [
      { label: 'Sessions orales / mois', free: '1', premium: '10 / semaine', pro: 'Illimité' },
      { label: 'Corrections écrites / mois', free: '2', premium: '20', pro: 'Illimité' },
      { label: 'Échanges guidés / jour', free: '3', premium: '100', pro: 'Illimité' },
      { label: 'OCR copies / mois', free: '—', premium: '20', pro: '50' },
      { label: 'Capacité de traitement / jour', free: '5k', premium: '50k', pro: '200k' },
      { label: 'Rapport PDF oral', free: '—', premium: 'Oui', pro: 'Oui' },
      { label: 'Graph RAG', free: '—', premium: '—', pro: 'Oui' },
      { label: 'Support', free: 'FAQ', premium: 'Email', pro: 'Prioritaire' },
    ],
  },
  faq: {
    eyebrow: 'FAQ facturation',
    title: 'Les questions d’argent doivent être traitées aussi clairement que le reste.',
    body:
      'Si la page est bonne, elle coupe court aux hésitations inutiles : quotas, changement de plan, paiement et alternatives sont lisibles sans jargon.',
    items: [
      {
        q: 'Que se passe-t-il si j’atteins un quota ?',
        a: 'La plateforme bloque l’action concernée, conserve ton travail et t’indique le plan utile pour reprendre sans repartir de zéro.',
      },
      {
        q: 'Puis-je changer de plan ?',
        a: 'Oui. Cette page sert justement à comparer, monter en puissance au bon moment et relire ton statut de facturation.',
      },
      {
        q: 'Comment fonctionne le paiement ?',
        a: 'Pour le moment, les abonnements payants sont activés par virement bancaire avec activation manuelle du plan. Le paiement carte et Flouci seront disponibles prochainement.',
      },
      {
        q: 'Et si je n’ai pas de carte bancaire ?',
        a: 'Flouci et le virement bancaire couvrent ce cas. Ajoute l’email du compte ou l’identifiant utilisateur en référence pour accélérer l’activation.',
      },
    ],
  },
  finalCard: {
    eyebrow: 'Dernier pas',
    title: 'Commence gratuitement si tu veux juger le produit sur pièce.',
    body:
      'Le plan gratuit suffit à tester le cœur du workflow. Le Premium vient ensuite si la préparation devient assez intense pour justifier plus de volume.',
    primaryCta: 'Créer mon compte gratuit',
    secondaryCta: "Retour à l’accueil",
  },
} as const;
