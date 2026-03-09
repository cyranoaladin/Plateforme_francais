'use client';

import Link from 'next/link';
import styles from './styles/hero.module.scss';

export function Hero() {
  return (
    <section className={styles.hero}>
      {/* Background Overlay */}
      <div className={styles.hero__background}>
        <div className={styles.hero__overlay} />
      </div>

      {/* Content */}
      <div className={styles.hero__content}>
        <div className={styles.hero__badge}>
          🇫🇷 Plateforme de préparation aux EAF
        </div>

        <h1 className={styles.hero__title}>
          Maîtrisez le français <br />
          <span className={styles.gradient_text}>en 8 semaines</span>
        </h1>

        <p className={styles.hero__subtitle}>
          Tuteur IA 24/7 + Corrections d&apos;experts + Progression garantie
        </p>

        <div className={styles.hero__ctas}>
          <Link href="/login?mode=register" className={`${styles.btn} ${styles['btn--primary']}`}>
            Essai gratuit 7 jours
          </Link>
          <Link href="#pricing" className={`${styles.btn} ${styles['btn--ghost']}`}>
            ▶ Voir les tarifs
          </Link>
        </div>

        {/* Social Proof */}
        <div className={styles.hero__proof}>
          <div className={styles.proof__rating}>⭐ 4.8/5 (2,341 avis)</div>
          <div className={styles.proof__users}>
            <span>✓ 12,450 élèves</span>
            <span>✓ 94% taux de réussite</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={styles.hero__scroll}>
        <div className={styles.scroll_mouse}></div>
      </div>
    </section>
  );
}
