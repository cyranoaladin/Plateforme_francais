export const publicFooterCopy = {
  brand: {
    title: 'Une préparation EAF exigeante, lisible et commercialement honnête.',
    body:
      "Nexus Réussite rassemble écrit, oral, langue et corpus documentaire dans un parcours premium cohérent avec le programme officiel, conçu pour faire produire l'élève, pas pour le remplacer.",
  },
  navigation: {
    title: 'Navigation',
    links: {
      method: 'La méthode',
      workshops: 'Ateliers',
      plans: 'Plans',
      faq: 'FAQ',
      legal: 'Mentions légales',
      contact: 'Contact',
    },
  },
  commitments: {
    title: 'Engagements',
    items: [
      'Anti-copie par design',
      'Sources internes visibles',
      'RGPD et comptes mineurs protégés',
      'Pas de publicité ciblée',
    ],
  },
  contact: {
    title: 'Contact',
    email: 'contact@nexusreussite.academy',
    viewPlans: 'Voir les plans et tarifs',
    createAccount: 'Créer un compte gratuit',
  },
  buildCopyright: (year: number) => `© ${year} Nexus Réussite. Tous droits réservés.`,
  legalNotice: 'Produit pédagogique commercial, sans publicité ciblée sur les comptes mineurs.',
} as const;
