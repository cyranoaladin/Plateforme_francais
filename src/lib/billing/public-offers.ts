import {
  PLAN_CATALOG,
  PLAN_DISPLAY_LABELS,
  type PlanId,
  type PublicPlanId,
  toPublicPlanId,
} from '@/lib/billing/plan-catalog';

type PublicEntitlementSummary = {
  oral: string;
  written: string;
  tutor: string;
  ocr: string;
  quiz: string;
  library: string;
};

export type PublicPlanOffer = {
  publicId: PublicPlanId;
  technicalId: PlanId;
  title: string;
  priceTnd: string;
  period: string;
  tagline: string;
  pricingNote: string;
  landingNote: string;
  footer: string;
  cta: string;
  ctaDisabledLabel: string;
  highlighted: boolean;
  summaries: PublicEntitlementSummary;
  pricingBullets: string[];
  landingBullets: string[];
};

function formatLimit(value: number | 'unlimited', period: 'day' | 'week' | 'month') {
  if (value === 'unlimited') {
    return 'Illimité';
  }

  const suffix = period === 'day' ? 'jour' : period === 'week' ? 'semaine' : 'mois';
  return `${value} / ${suffix}`;
}

function buildPublicSummaries(planId: PlanId): PublicEntitlementSummary {
  const quotas = PLAN_CATALOG[planId].quotas;

  return {
    oral: formatLimit(quotas.ORAL_SESSIONS!.limit, quotas.ORAL_SESSIONS!.period),
    written: formatLimit(quotas.WRITTEN_CORRECTIONS!.limit, quotas.WRITTEN_CORRECTIONS!.period),
    tutor: formatLimit(quotas.TUTOR_QUESTIONS!.limit, quotas.TUTOR_QUESTIONS!.period),
    ocr: formatLimit(quotas.OCR_COPIES!.limit, quotas.OCR_COPIES!.period),
    quiz: formatLimit(quotas.QUIZ_PER_DAY!.limit, quotas.QUIZ_PER_DAY!.period),
    library: PLAN_CATALOG[planId].flags.LIBRARY_FULL_ACCESS ? 'Bibliothèque complète' : 'Échantillon de bibliothèque',
  };
}

const PLAN_COPY: Record<PlanId, Omit<PublicPlanOffer, 'publicId' | 'technicalId' | 'title' | 'priceTnd' | 'period' | 'summaries'>> = {
  FREE: {
    tagline: 'Découvre la méthode sans paiement.',
    pricingNote: 'Accès limité pour tester les ateliers, le suivi et la logique pédagogique avant tout règlement.',
    landingNote: 'Découvre la méthode sans paiement.',
    footer: 'Création de compte immédiate, sans carte bancaire.',
    cta: 'Essayer gratuitement',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: false,
    pricingBullets: [],
    landingBullets: [],
  },
  PREMIUM: {
    tagline: 'Le plan complet pour travailler chaque semaine.',
    pricingNote: 'Le bon point d’équilibre quand tu veux supprimer les plafonds les plus bloquants et avancer sérieusement chaque semaine.',
    landingNote: 'Le plan complet pour travailler chaque semaine.',
    footer: 'Règlement par virement bancaire ou espèces, puis code d’activation.',
    cta: 'Passer à Premium',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: true,
    pricingBullets: [],
    landingBullets: [],
  },
  PRO: {
    tagline: 'Pour travailler sans plafond et viser la mention.',
    pricingNote: 'Pensé pour une préparation intensive: oral, écrit, quiz et tuteur ne bloquent plus le rythme de travail.',
    landingNote: 'Pour travailler sans plafond et viser la mention.',
    footer: 'Même parcours d’activation manuelle, avec le niveau de service le plus élevé.',
    cta: 'Passer à Masterium',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: false,
    pricingBullets: [],
    landingBullets: [],
  },
};

function buildPricingBullets(planId: PlanId, summaries: PublicEntitlementSummary) {
  const common = [
    `${summaries.oral} de simulation orale`,
    `${summaries.written} de correction écrite`,
    `${summaries.tutor} d’échanges guidés`,
    `${summaries.ocr} d’analyse de copies`,
  ];

  if (planId === 'FREE') {
    return [...common, summaries.library];
  }

  if (planId === 'PREMIUM') {
    return [...common, 'Rapport PDF oral', summaries.library];
  }

  return [...common, 'Recherche avancée dans le corpus', 'Historique oral complet', 'Support prioritaire', summaries.library];
}

function buildLandingBullets(planId: PlanId, summaries: PublicEntitlementSummary) {
  if (planId === 'FREE') {
    return [
      `${summaries.oral} de simulation orale`,
      `${summaries.written} de correction écrite`,
      `${summaries.tutor} d’échanges guidés`,
      summaries.library,
    ];
  }

  if (planId === 'PREMIUM') {
    return [
      `${summaries.oral} de simulation orale`,
      `${summaries.written} de correction écrite`,
      `${summaries.tutor} d’échanges guidés`,
      'Rapport PDF oral',
      summaries.library,
      'Activation par code après règlement',
    ];
  }

  return [
    `${summaries.oral} d’oral`,
    `${summaries.written} de corrections écrites`,
    `${summaries.tutor} d’accompagnement guidé`,
    'Recherche avancée dans le corpus',
    'Historique oral complet',
    'Support prioritaire',
  ];
}

function buildOffer(planId: PlanId): PublicPlanOffer {
  const config = PLAN_CATALOG[planId];
  const summaries = buildPublicSummaries(planId);
  const copy = PLAN_COPY[planId];

  return {
    publicId: toPublicPlanId(planId),
    technicalId: planId,
    title: PLAN_DISPLAY_LABELS[planId],
    priceTnd: `${config.priceTnd} TND`,
    period: config.billingCycle === 'monthly' ? '/ mois' : '',
    tagline: copy.tagline,
    pricingNote: copy.pricingNote,
    landingNote: copy.landingNote,
    footer: copy.footer,
    cta: copy.cta,
    ctaDisabledLabel: copy.ctaDisabledLabel,
    highlighted: copy.highlighted,
    summaries,
    pricingBullets: buildPricingBullets(planId, summaries),
    landingBullets: buildLandingBullets(planId, summaries),
  };
}

export const PUBLIC_PLAN_OFFERS: PublicPlanOffer[] = [
  buildOffer('FREE'),
  buildOffer('PREMIUM'),
  buildOffer('PRO'),
];

export const PUBLIC_PLAN_FEATURE_ROWS = [
  {
    label: 'Sessions orales',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.oral,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.oral,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.oral,
    },
  },
  {
    label: 'Corrections écrites',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.written,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.written,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.written,
    },
  },
  {
    label: 'Échanges guidés',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.tutor,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.tutor,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.tutor,
    },
  },
  {
    label: 'Analyse de copies',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.ocr,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.ocr,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.ocr,
    },
  },
  {
    label: 'Quiz',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.quiz,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.quiz,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.quiz,
    },
  },
  {
    label: 'Bibliothèque',
    values: {
      FREEMIUM: PUBLIC_PLAN_OFFERS[0].summaries.library,
      PREMIUM: PUBLIC_PLAN_OFFERS[1].summaries.library,
      MASTERIUM: PUBLIC_PLAN_OFFERS[2].summaries.library,
    },
  },
  {
    label: 'Rapport PDF oral',
    values: {
      FREEMIUM: '—',
      PREMIUM: 'Oui',
      MASTERIUM: 'Oui',
    },
  },
  {
    label: 'Support',
    values: {
      FREEMIUM: 'FAQ',
      PREMIUM: 'Email',
      MASTERIUM: 'Prioritaire',
    },
  },
];

export function getPublicOfferById(planId: PublicPlanId) {
  return PUBLIC_PLAN_OFFERS.find((offer) => offer.publicId === planId) ?? PUBLIC_PLAN_OFFERS[0];
}

export function getPublicOfferFromAnyPlan(plan: string) {
  return getPublicOfferById(toPublicPlanId(plan));
}
