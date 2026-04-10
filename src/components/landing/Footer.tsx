'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ padding: '60px 2rem 40px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Grille footer */}
      <div
        className="grid gap-10 mb-12"
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

      {/* Footer bottom */}
      <div
        className="flex justify-between pt-7"
        style={{
          borderTop: '1px solid var(--eaf-border)',
          fontSize: '12px',
          color: 'var(--eaf-text-tertiary)',
        }}
      >
        <span>© 2026 Nexus Réussite. Tous droits réservés.</span>
        <span>Conçu par des enseignants agréés de Français</span>
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
