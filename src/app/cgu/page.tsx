import Link from 'next/link';
import { ArrowLeft, FileText, Scale } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\u2019Utilisation — Nexus Réussite',
  description: 'Conditions générales d\u2019utilisation de Nexus EAF',
};

const CGU_ITEMS = [
  'Le service est destiné aux élèves de Première préparant l\u2019EAF.',
  'L\u2019utilisation doit respecter le cadre pédagogique et les règles de propriété intellectuelle.',
  'Les contenus générés par IA sont fournis à titre indicatif et ne remplacent pas un enseignement officiel.',
  'Nexus EAF se réserve le droit de suspendre un compte en cas d\u2019usage abusif ou frauduleux.',
  'Les tarifs des plans Premium et Masterium sont affichés en TND et peuvent être modifiés avec un préavis de 30 jours.',
];

export default function CguPage() {
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
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cadre contractuel</p>
          <h1
            className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
          >
            Conditions Générales d{'\u2019'}Utilisation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Ces conditions encadrent l{'\u2019'}utilisation du service Nexus Réussite EAF. En vous inscrivant, vous acceptez les termes ci-dessous.
          </p>
        </section>

        <div className="mt-10 space-y-6">
          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Scale className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Conditions d{'\u2019'}utilisation du service
                </h2>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Version 2026-03</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
                  En utilisant Nexus EAF, vous acceptez les conditions suivantes :
                </p>
                <div className="mt-4 space-y-3">
                  {CGU_ITEMS.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--c-primary)] text-[10px] font-bold text-[var(--bg-page)]">
                        {index + 1}
                      </span>
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
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Contact
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                  Pour toute question concernant ces conditions, contactez-nous :
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
          <span className="text-[var(--text-placeholder)]">·</span>
          <Link href="/mentions-legales" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Mentions légales
          </Link>
          <span className="text-[var(--text-placeholder)]">·</span>
          <Link href="/politique-de-confidentialite" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
}
