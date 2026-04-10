import { BookOpenText, BrainCircuit, FileStack, MessageCircleMore, Mic, ScanSearch, Sparkles } from 'lucide-react';

const FEATURE_GROUPS = [
  {
    title: 'Atelier écrit',
    icon: FileStack,
    tone: 'bg-[var(--c-primary)] text-[var(--bg-page)] border-white/10',
    badge: 'Production longue',
    span: 'lg:col-span-7',
    body: 'Dépose une copie PDF ou image, récupère une analyse automatique, une correction par rubriques et un rapport clair à reprendre.',
    bullets: ['Dépôt PDF/image', 'Analyse automatique + correction structurée', 'Rapport PDF exploitable'],
  },
  {
    title: 'Oral officiel',
    icon: Mic,
    tone: 'bg-[var(--bg-surface)] text-[var(--c-primary)] border-[var(--border-strong)]',
    badge: 'Format EAF',
    span: 'lg:col-span-5',
    body: 'Lecture, explication, grammaire et entretien restent visibles comme quatre séquences distinctes, avec leurs max officiels.',
    bullets: ['Barème /2 /8 /2 /8', 'Relances pédagogiques', 'Œuvre choisie intégrée'],
  },
  {
    title: 'Corpus et citations',
    icon: ScanSearch,
    tone: 'bg-[var(--bg-surface)] text-[var(--c-primary)] border-[var(--border-strong)]',
    badge: 'Sources visibles',
    span: 'lg:col-span-4',
    body: 'Le guidage et les ateliers mobilisent BO, Eduscol, rapports de jury et œuvres au programme avec des références internes visibles et réutilisables.',
    bullets: ['Citations internes', 'Recherche intelligente dans le corpus', 'Corpus 2025-2026'],
  },
  {
    title: 'Langue et quiz adaptatif',
    icon: BrainCircuit,
    tone: 'bg-[var(--bg-surface-secondary)] text-[var(--c-primary)] border-[var(--border-strong)]',
    badge: 'Relance ciblée',
    span: 'lg:col-span-4',
    body: 'Question de grammaire, erreurs de langue, quiz et thèmes faibles sont reliés au même diagnostic.',
    bullets: ['Axes du programme', 'Retour immédiat', 'Priorisation des lacunes'],
  },
  {
    title: 'Guidage personnalisé et mémoire de progression',
    icon: MessageCircleMore,
    tone: 'bg-[var(--bg-surface)] text-[var(--c-primary)] border-[var(--border-strong)]',
    badge: 'Accompagnement actif',
    span: 'lg:col-span-4',
    body: 'Chaque échange utile enrichit le profil, réactive les compétences à reprendre et influence la prochaine séance au lieu de repartir de zéro.',
    bullets: ['Relances contextuelles', 'Détection de tes points à retravailler', 'Séances suivantes cohérentes'],
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Ateliers EAF</p>
            <h2
              className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
            >
              Tout ce qu{'\u2019'}il faut pour réussir l{'\u2019'}EAF, organisé par usage réel.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            La page ne vend pas des “features” abstraites. Elle expose des situations concrètes de travail : produire,
            corriger, citer, relancer, piloter.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {FEATURE_GROUPS.map((feature, index) => (
            <article
              key={feature.title}
              className={`${feature.span} ${feature.tone} rounded-[var(--radius-2xl)] border p-6 shadow-[var(--shadow-md)] [animation:bienvenueFadeUp_.82s_ease-out_both] md:p-7`}
              style={{ animationDelay: `${0.08 + index * 0.06}s` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-current/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]">
                  {feature.badge}
                </span>
              </div>

              <h3 className="font-display mt-6 text-3xl leading-tight tracking-[-0.03em]">
                {feature.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 opacity-85 sm:text-base">{feature.body}</p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {feature.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="inline-flex items-center gap-2 rounded-full border border-current/12 bg-black/5 px-3.5 py-1.5 text-xs font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {bullet}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[var(--radius-2xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Fil directeur</p>
              <h3 className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                De la copie à la relance, le même système garde le cap.
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: BookOpenText, title: 'Produire', text: 'Toujours une sortie concrète : copie, oral, réponse ou correction.' },
                { icon: ScanSearch, title: 'Justifier', text: 'Les réponses exploitables gardent la trace des sources et des attentes.' },
                { icon: BrainCircuit, title: 'Réactiver', text: 'Le retour alimente ensuite le parcours au lieu de se perdre.' },
              ].map((item) => (
                <div key={item.title} className="rounded-[var(--radius-2xl)] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                  <item.icon className="h-5 w-5 text-[var(--c-success)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--c-primary)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
