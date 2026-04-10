import Link from 'next/link';
import { ArrowLeft, Building2, Globe, Lock, Scale, FileText, Mail } from 'lucide-react';

export const metadata = {
  title: 'Mentions légales & CGU',
  description: 'Mentions légales et conditions générales d\u2019utilisation de Nexus EAF',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <main className="relative mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-4 shadow-[var(--shadow-md)]">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--c-primary)]">
            <ArrowLeft className="h-4 w-4" />
            Retour accueil
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cadre juridique</p>
          <h1
            className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
          >
            Mentions légales & Conditions Générales d{'\u2019'}Utilisation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Ce document rassemble les informations légales obligatoires, les conditions d{'\u2019'}utilisation du service
            et les engagements de Nexus Réussite en matière de protection des données.
          </p>
        </section>

        <div className="mt-10 space-y-6">
          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Éditeur du site
                </h2>
                <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                  <p><span className="font-semibold text-[var(--c-primary)]">Raison sociale :</span> STE M&M ACADEMY SUARL</p>
                  <p><span className="font-semibold text-[var(--c-primary)]">Email de contact :</span>{' '}
                    <a href="mailto:contact@nexusreussite.academy" className="text-[var(--c-success)] hover:underline">contact@nexusreussite.academy</a>
                  </p>
                  <p><span className="font-semibold text-[var(--c-primary)]">Site web :</span>{' '}
                    <a href="https://eaf.nexusreussite.academy" className="text-[var(--c-success)] hover:underline">https://eaf.nexusreussite.academy</a>
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Hébergement
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">Le site est hébergé par :</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Infrastructure</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--c-primary)]">OVH SAS</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">2 rue Kellermann, 59100 Roubaix, France</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Déploiement</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--c-primary)]">Serveur dédié (VPS)</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Déploiement et exploitation en interne (Nexus Réussite)</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-success)]/10 text-[var(--c-success)]">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Protection des données (RGPD)
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                  Nexus EAF s{'\u2019'}engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données :
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Collecte minimale', body: 'Nous ne collectons que les données strictement nécessaires au fonctionnement du service.' },
                    { label: 'Traitement des mineurs', body: 'Pour les utilisateurs de moins de 15 ans, un consentement parental est requis (email parent).' },
                    { label: 'Droit d\u2019accès et de suppression', body: 'Vous pouvez à tout moment demander l\u2019accès, la modification ou la suppression de vos données via contact@nexusreussite.academy.' },
                    { label: 'Pas de revente', body: 'Vos données ne sont jamais vendues à des tiers.' },
                    { label: 'Sécurité', body: 'Les mots de passe sont hachés, les sessions sécurisées par cookies HttpOnly.' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--c-primary)]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Scale className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Conditions Générales d{'\u2019'}Utilisation
                </h2>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Version 2026-03</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
                  En utilisant Nexus EAF, vous acceptez les conditions suivantes :
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    'Le service est destiné aux élèves de Première préparant l\u2019EAF.',
                    'L\u2019utilisation doit respecter le cadre pédagogique et les règles de propriété intellectuelle.',
                    'Les contenus générés par IA sont fournis à titre indicatif et ne remplacent pas un enseignement officiel.',
                    'Nexus EAF se réserve le droit de suspendre un compte en cas d\u2019usage abusif ou frauduleux.',
                    'Les tarifs des plans Premium et Masterium sont affichés en TND et peuvent être modifiés avec un préavis de 30 jours.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-primary)]" />
                      <p className="text-sm leading-6 text-[var(--text-body)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Propriété intellectuelle
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                  Tous les contenus du site (textes, images, logos, structure) sont protégés par le droit d{'\u2019'}auteur.
                  Toute reproduction sans autorisation est interdite.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Contact
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                  Pour toute question concernant ces mentions légales ou les CGU, contactez-nous :
                </p>
                <a
                  href="mailto:contact@nexusreussite.academy"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-sm font-bold text-[var(--bg-page)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
                >
                  contact@nexusreussite.academy
                </a>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-5 shadow-[var(--shadow-md)]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]">
            <ArrowLeft className="h-4 w-4" />
            Retour à l{'\u2019'}accueil
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/cgu" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            CGU détaillées
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/politique-de-confidentialite" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
}
