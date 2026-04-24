import { BookOpenText, BrainCircuit, FileStack, MessageCircleMore, Mic, ScanSearch, Sparkles } from '@/components/ui/icons';

const FEATURE_GROUPS = [
  {
    title: 'Atelier écrit',
    icon: FileStack,
    badge: 'Production longue',
    span: 'lg:col-span-7',
    animationClass: 'animation-delay-100',
    body: 'Dépose une copie PDF ou image, récupère une analyse automatique, une correction par rubriques et un rapport clair à reprendre.',
    bullets: ['Dépôt PDF/image', 'Analyse automatique + correction structurée', 'Rapport PDF exploitable'],
  },
  {
    title: 'Oral officiel',
    icon: Mic,
    badge: 'Format EAF',
    span: 'lg:col-span-5',
    animationClass: 'animation-delay-140',
    body: 'Lecture, explication, grammaire et entretien restent visibles comme quatre séquences distinctes, avec leurs max officiels.',
    bullets: ['Barème /2 /8 /2 /8', 'Relances pédagogiques', 'Œuvre choisie intégrée'],
  },
  {
    title: 'Corpus et citations',
    icon: ScanSearch,
    badge: 'Sources visibles',
    span: 'lg:col-span-4',
    animationClass: 'animation-delay-200',
    body: 'Le guidage et les ateliers mobilisent BO, Eduscol, rapports de jury et œuvres au programme avec des références internes visibles et réutilisables.',
    bullets: ['Citations internes', 'Recherche intelligente dans le corpus', 'Corpus 2025-2026'],
  },
  {
    title: 'Langue et quiz adaptatif',
    icon: BrainCircuit,
    badge: 'Relance ciblée',
    span: 'lg:col-span-4',
    animationClass: 'animation-delay-260',
    body: 'Question de grammaire, erreurs de langue, quiz et thèmes faibles sont reliés au même diagnostic.',
    bullets: ['Axes du programme', 'Retour immédiat', 'Priorisation des lacunes'],
  },
  {
    title: 'Guidage personnalisé et mémoire de progression',
    icon: MessageCircleMore,
    badge: 'Accompagnement actif',
    span: 'lg:col-span-4',
    animationClass: 'animation-delay-320',
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
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-teal)]">Ateliers EAF</p>
            <h2
              className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)] sm:text-5xl"
              style={{ fontFamily: 'var(--eaf-font-display)' }}
            >
              Tout ce qu'il faut pour réussir l'EAF, organisé par usage réel.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--eaf-text-secondary)] sm:text-base">
            La page ne vend pas des "features" abstraites. Elle expose des situations concrètes de travail : produire,
            corriger, citer, relancer, piloter.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {FEATURE_GROUPS.map((feature) => (
            <article
              key={feature.title}
              className={`${feature.span} ${feature.animationClass} rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md animate-bienvenue-fade-up-delay-2 md:p-7`}
              style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
            >
              <div className="flex items-center justify-between gap-4">
                <div 
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                >
                  <feature.icon className="h-5 w-5 text-[var(--eaf-orange)]" />
                </div>
                <span 
                  className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-text-secondary)]"
                  style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                >
                  {feature.badge}
                </span>
              </div>

              <h3 
                className="mt-6 text-3xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)]"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                {feature.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-text-secondary)] sm:text-base">{feature.body}</p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {feature.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-[var(--eaf-text-secondary)]"
                    style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[var(--eaf-orange)]" />
                    {bullet}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div 
          className="mt-10 rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md md:p-7"
          style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
        >
          <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-teal)]">Fil directeur</p>
              <h3 
                className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)]"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                De la copie à la relance, le même système garde le cap.
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: BookOpenText, title: 'Produire', text: 'Toujours une sortie concrète : copie, oral, réponse ou correction.' },
                { icon: ScanSearch, title: 'Justifier', text: 'Les réponses exploitables gardent la trace des sources et des attentes.' },
                { icon: BrainCircuit, title: 'Réactiver', text: 'Le retour alimente ensuite le parcours au lieu de se perdre.' },
              ].map((item) => (
                <div 
                  key={item.title} 
                  className="rounded-[var(--eaf-radius-2xl)] border p-4"
                  style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                >
                  <item.icon className="h-5 w-5 text-[var(--eaf-teal)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--eaf-orange)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--eaf-text-secondary)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
