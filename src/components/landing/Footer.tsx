'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ padding: '40px 20px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Desktop: Grid 4 colonnes */}
      <div
        className="hidden lg:grid gap-10 mb-12"
        style={{ gridTemplateColumns: '220px repeat(3, 1fr)' }}
      >
        {/* Colonne 1 — Brand */}
        <div>
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center text-white font-bold text-xs"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--eaf-indigo), var(--eaf-indigo-hover))',
              }}
            >
              N
            </div>
            <span
              className="font-semibold text-white"
              style={{ fontSize: '15px', fontFamily: 'var(--eaf-font-display)' }}
            >
              Nexus Réussite
            </span>
          </Link>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--eaf-text-tertiary)',
              lineHeight: 1.6,
            }}
          >
            La préparation EAF qui fait enfin travailler juste. Sources BO 2026, barème
            officiel, zéro triche.
          </p>
        </div>

        {/* Colonne 2 — Liens rapides */}
        <div>
          <div
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--eaf-text-tertiary)',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Liens rapides
          </div>
          <FooterLink href="/">Accueil</FooterLink>
          <FooterLink href="#pricing">Tarifs</FooterLink>
          <FooterLink href="/login">Connexion</FooterLink>
          <FooterLink href="/login">Commencer</FooterLink>
        </div>

        {/* Colonne 3 — Les ateliers */}
        <div>
          <div
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--eaf-text-tertiary)',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Les ateliers
          </div>
          <FooterLink href="/atelier-oral">Atelier Oral</FooterLink>
          <FooterLink href="/atelier-ecrit">Atelier Écrit</FooterLink>
          <FooterLink href="/atelier-langue">Atelier Langue</FooterLink>
          <FooterLink href="/quiz">Quiz</FooterLink>
        </div>

        {/* Colonne 4 — Contact & Légal */}
        <div>
          <div
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--eaf-text-tertiary)',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Contact & Légal
          </div>
          <FooterLink href="mailto:contact@nexusreussite.academy">
            contact@nexusreussite.academy
          </FooterLink>
          <FooterLink href="/mentions-legales">Mentions légales</FooterLink>
          <FooterLink href="/cgu">CGU</FooterLink>
          <FooterLink href="/politique-de-confidentialite">
            Politique de confidentialité
          </FooterLink>
        </div>
      </div>

      {/* Mobile: Compact */}
      <div className="lg:hidden">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--eaf-indigo), #4458D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            N
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Nexus Réussite</span>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--eaf-text-tertiary)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          Préparation EAF — Oral, écrit, grammaire, corpus officiel.
        </p>

        {/* Liens en 2 colonnes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 16px',
            marginBottom: '24px',
          }}
        >
          {[
            { label: 'Accueil', href: '/' },
            { label: 'Tarifs', href: '#pricing' },
            { label: 'Connexion', href: '/login' },
            { label: 'Atelier Oral', href: '/atelier-oral' },
            { label: 'Atelier Écrit', href: '/atelier-ecrit' },
            { label: 'Mentions légales', href: '/mentions-legales' },
            { label: 'CGU', href: '/cgu' },
            { label: 'Confidentialité', href: '/politique-de-confidentialite' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ fontSize: '13px', color: 'var(--eaf-text-secondary)', textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer bottom */}
      <div
        className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-2"
        style={{
          borderTop: '1px solid var(--eaf-border)',
          fontSize: '12px',
          color: 'var(--eaf-text-tertiary)',
        }}
      >
        <span>© 2026 Nexus Réussite. Conçu par des enseignants agréés.</span>
        <span className="hidden sm:inline">Tous droits réservés.</span>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block transition-colors duration-200"
      style={{
        fontSize: '13px',
        color: 'var(--eaf-text-secondary)',
        textDecoration: 'none',
        marginBottom: '8px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eaf-text-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eaf-text-secondary)')}
    >
      {children}
    </Link>
  );
}
