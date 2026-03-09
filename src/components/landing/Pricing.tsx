'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './styles/pricing.module.scss';

interface PricingTier {
  id: 'apprenti' | 'developpement' | 'maitrise';
  name: string;
  symbol: string;
  price: string;
  priceAnnual: string;
  period: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  savings?: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'apprenti',
    name: 'Apprenti',
    symbol: '📚',
    price: '0€',
    priceAnnual: '0€',
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
    name: 'Développement',
    symbol: '🚀',
    price: '15€',
    priceAnnual: '12€',
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
    cta: 'Essayer 7 jours gratuit',
    highlight: true,
    savings: 'Économisez 36€/an',
  },
  {
    id: 'maitrise',
    name: 'Maîtrise',
    symbol: '👑',
    price: '24€',
    priceAnnual: '24€',
    period: '/mois',
    description: "Atteindre la maîtrise",
    features: [
      'Tout Développement +',
      'Coaching 1-on-1 (1h/mois)',
      'Simulation examen complète',
      "Révisions sur mesure IA",
      'Support prioritaire (chat 2h)',
      "Certificat de réussite",
    ],
    cta: "Accéder à la maîtrise",
    highlight: false,
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.container}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>Tarifs transparents, flexibles</h2>
          <p className={styles.section__subtitle}>Choisissez ce qui vous convient</p>
          
          <div className={styles.pricing__toggle}>
            <span className={!isAnnual ? styles.active : ''}>Mensuel</span>
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Toggle billing period"
              role="switch"
              aria-checked={isAnnual}
            >
              <span className={styles.toggle__slider} />
            </button>
            <span className={isAnnual ? styles.active : ''}>Annuel (-20%)</span>
          </div>
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
                <span className={styles.amount}>
                  {isAnnual ? tier.priceAnnual : tier.price}
                </span>
                <span className={styles.period}>{tier.period}</span>
              </div>

              {tier.savings && isAnnual && (
                <div className={styles.card__savings}>💰 {tier.savings}</div>
              )}

              <Link 
                href="/signup"
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
