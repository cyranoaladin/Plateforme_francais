import Link from 'next/link';
import { ArrowLeft, Lock, Shield, UserCheck, DatabaseZap, KeyRound } from 'lucide-react';

export const metadata = {
  title: 'Politique de confidentialité — Nexus Réussite',
  description: 'Politique de confidentialité et traitement des données personnelles de Nexus EAF',
};

const EDITORIAL_HEADING = {
  fontFamily: 'var(--font-display)',
};

const DATA_PROTECTION_ITEMS = [
  {
    icon: DatabaseZap,
    label: 'Collecte minimale',
    body: 'Nous ne collectons que les données strictement nécessaires au fonctionnement du service : email, nom affiché, niveau scolaire et données de progression pédagogique.',
  },
  {
    icon: UserCheck,
    label: 'Traitement des mineurs',
    body: 'Pour les utilisateurs de moins de 15 ans, un consentement parental est requis. L\u2019email du responsable légal est demandé lors de l\u2019inscription.',
  },
  {
    icon: Shield,
    label: 'Droit d\u2019accès et de suppression',
    body: 'Vous pouvez à tout moment demander l\u2019accès, la modification ou la suppression de vos données via contact@nexusreussite.academy.',
  },
  {
    icon: Lock,
    label: 'Pas de revente',
    body: 'Vos données ne sont jamais vendues à des tiers. Aucune publicité ciblée n\u2019est diffusée sur les comptes mineurs.',
  },
  {
    icon: KeyRound,
    label: 'Sécurité technique',
    body: 'Les mots de passe sont hachés via des algorithmes robustes. Les sessions sont sécurisées par cookies HttpOnly avec protection CSRF.',
  },
];

export default function PolitiqueDeConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[var(--surface-cream)] text-[var(--text-heading)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <main className="relative mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-md)]">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]">
            <ArrowLeft className="h-4 w-4" />
            Retour accueil
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Données personnelles</p>
          <h1
            style={EDITORIAL_HEADING}
            className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl"
          >
            Politique de confidentialité
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Nexus Réussite s{'\u2019'}engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <div className="mt-10 space-y-6">
          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 style={EDITORIAL_HEADING} className="text-2xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                  Protection des données (RGPD)
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                  Notre politique de protection des données repose sur cinq engagements concrets :
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {DATA_PROTECTION_ITEMS.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--card)] text-[var(--navy)] shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--navy)]">{item.label}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <h2 style={EDITORIAL_HEADING} className="text-2xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
              Contact
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :
            </p>
            <a
              href="mailto:contact@nexusreussite.academy"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-5 py-2.5 text-sm font-bold text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]"
            >
              contact@nexusreussite.academy
            </a>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)] px-6 py-5 shadow-[var(--shadow-md)]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:text-[var(--teal)]">
            <ArrowLeft className="h-4 w-4" />
            Retour à l{'\u2019'}accueil
          </Link>
          <span className="text-[var(--text-placeholder)]">·</span>
          <Link href="/mentions-legales" className="text-sm font-semibold text-[var(--teal)] transition-colors hover:underline">
            Mentions légales
          </Link>
          <span className="text-[var(--text-placeholder)]">·</span>
          <Link href="/cgu" className="text-sm font-semibold text-[var(--teal)] transition-colors hover:underline">
            CGU
          </Link>
        </div>
      </main>
    </div>
  );
}
