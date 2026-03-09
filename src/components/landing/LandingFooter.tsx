'use client';

import Link from 'next/link';
import styles from './styles/footer.module.scss';

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footer__grid}>
          <div className={styles.footer__brand}>
            <div className={styles.brand__logo}>
              <span className={styles.logo__icon}>🇫🇷</span>
              <span className={styles.logo__text}>Nexus Réussite</span>
            </div>
            <p className={styles.brand__tagline}>
              Excellence en français
            </p>
            <p className={styles.brand__description}>
              Plateforme de préparation aux Épreuves Anticipées de Français. 
              Tuteur IA, corrections d&apos;experts, progression garantie.
            </p>
          </div>

          <div className={styles.footer__links}>
            <h4>Navigation</h4>
            <ul>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#pricing">Tarifs</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><Link href="/login">Connexion</Link></li>
            </ul>
          </div>

          <div className={styles.footer__links}>
            <h4>Légal</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/mentions-legales">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales">CGU</Link></li>
            </ul>
          </div>

          <div className={styles.footer__links}>
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:contact@nexusreussite.academy">contact@nexusreussite.academy</a></li>
              <li><Link href="/pricing">Voir les plans</Link></li>
              <li><Link href="/signup">Créer un compte</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footer__bottom}>
          <p>&copy; {new Date().getFullYear()} Nexus Réussite. Tous droits réservés.</p>
          <p>Produit pédagogique commercial, sans publicité ciblée.</p>
        </div>
      </div>
    </footer>
  );
}
