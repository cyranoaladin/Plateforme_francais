export const publicLandingFooterCopy = {
  brand: {
    name: 'Nexus Réussite',
    tagline: 'Excellence en français',
    description:
      "Plateforme de préparation aux Épreuves Anticipées de Français. Tuteur IA, corrections d'experts, progression garantie.",
  },
  navigation: {
    title: 'Navigation',
    links: {
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      faq: 'FAQ',
      login: 'Connexion',
    },
  },
  legal: {
    title: 'Légal',
    links: {
      mentions: 'Mentions légales',
      privacy: 'Politique de confidentialité',
      terms: 'CGU',
    },
  },
  contact: {
    title: 'Contact',
    email: 'contact@nexusreussite.academy',
    viewPlans: 'Voir les plans',
    createAccount: 'Créer un compte',
  },
  buildCopyright: (year: number) => `© ${year} Nexus Réussite. Tous droits réservés.`,
  legalNotice: 'Produit pédagogique commercial, sans publicité ciblée.',
} as const;
