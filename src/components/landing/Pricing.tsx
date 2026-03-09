'use client';

import Link from 'next/link';
import styles from './styles/pricing.module.scss';

interface PricingTier {
  id: 'apprenti' | 'developpement' | 'maitrise';
  name: string;
  symbol: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const TIERS: PricingTier[] = [
  {
    id: 'apprenti',
    name: 'Free',
    symbol: '📚',
    price: '0 TND',
    period: 'pour toujours',
    description: "Débuter votre parcours",
    features: [
      '3 corrections/mois',
      'Tuteur IA basique',
      "Accès aux ressources",
      "Communauté élèves",
      'Support par email (48h)',
    ],
    cta: 'Commencer mon parcours',
    highlight: false,
  },
  {
    id: 'developpement',
    name: 'Premium',
    symbol: '🚀',
    price: '99 TND',
    period: '/mois',
    description: "Progresser vers l'excellence",
    badge: "Le plus choisi par les élèves",
    features: [
      "Corrections illimitées",
      "Tuteur IA avancé + feedback détaillé",
      'Analyse vidéo (grammaire, style)',
      "Statistiques de progression",
      "Accès bibliothèque complète (553 ressources)",
      'Support par email (24h)',
    ],
    cta: 'Commencer en Premium',
    highlight: true,
  },
  {
    id: 'maitrise',
    name: 'Pro',
    symbol: '👑',
    price: '129 TND',
    period: '/mois',
    description: "Atteindre la maîtrise",
    features: [
      'Tout Premium +',
      'Coaching 1-on-1 (1h/mois)',
      'Simulation examen complète',
      "Révisions sur mesure IA",
      'Support prioritaire (chat 2h)',
      "Certificat de réussite",
    ],
    cta: "Passer en Pro",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.container}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>Tarifs transparents, flexibles</h2>
          <p className={styles.section__subtitle}>Choisissez ce qui vous convient</p>
        </div>

        <div className={styles.pricing__grid}>
          {TIERS.map((tier) => (
            <div 
              key={tier.id} 
              className={`${styles.pricing__card} ${tier.highlight ? styles.highlight : ''}`}
            >
              {tier.badge && (
                <div className={styles.card__badge}>{tier.badge}</div>
              )}
              
              <div className={styles.card__symbol}>{tier.symbol}</div>
              <h3 className={styles.card__name}>{tier.name}</h3>
              <p className={styles.card__description}>{tier.description}</p>
              
              <div className={styles.card__price}>
                <span className={styles.amount}>{tier.price}</span>
                <span className={styles.period}>{tier.period}</span>
              </div>

              <Link 
                href="/login?mode=register"
                className={`${styles.btn} ${tier.highlight ? styles['btn--primary'] : styles['btn--secondary']}`}
              >
                {tier.cta}
              </Link>

              <div className={styles.card__divider} />

              <ul className={styles.card__features}>
                {tier.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className={styles.check}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.pricing__faq}>
          <p>Besoin d’aide ? <a href="#faq">Consultez notre FAQ</a> ou <a href="mailto:contact@nexusreussite.academy">contactez notre équipe</a></p>
        </div>
      </div>
    </section>
  );
}
