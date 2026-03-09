'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './styles/header.module.scss';

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>
        <Link href="/bienvenue" className={styles.nav__logo}>
          <span className={styles.logo__icon}>🇫🇷</span>
          <span className={styles.logo__text}>Nexus Réussite</span>
        </Link>

        <button
          className={styles.nav__toggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`${styles.nav__links} ${isMobileMenuOpen ? styles.open : ''}`}>
          <li><a href="#features">Fonctionnalités</a></li>
          <li><a href="#pricing">Tarifs</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className={styles.nav__cta}>
          <Link href="/login" className={styles['btn--ghost']}>
            Connexion
          </Link>
          <Link href="/login?mode=register" className={styles['btn--primary']}>
            Essai gratuit
          </Link>
        </div>
      </nav>
    </header>
  );
}
