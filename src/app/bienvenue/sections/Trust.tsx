import { CheckCheck, LockKeyhole, Quote, ShieldCheck, UserRoundCheck } from 'lucide-react';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const TRUST_BLOCKS = [
  {
    icon: Quote,
    title: 'Sources visibles, jamais opaques',
    description: 'Quand le corpus intervient, l’élève voit ce qui fonde la réponse : BO, Eduscol, rapports de jury, œuvres au programme.',
  },
  {
    icon: UserRoundCheck,
    title: 'Anti-copie intégré dans le produit',
    description: 'La plateforme refuse la dissertation ou le commentaire complets et bascule vers une alternative guidée, constructive et traçable.',
  },
  {
    icon: LockKeyhole,
    title: 'Protection des comptes et des mineurs',
    description: 'Sessions sécurisées, accès contrôlé, posture RGPD et refus de la publicité ciblée sur les comptes mineurs.',
  },
];

export function Trust() {
  return (
    <section id="securite" className="scroll-mt-24 bg-[var(--c-primary)] py-20 text-[var(--bg-page)] md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">Engagements non négociables</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
              Une plateforme commerciale crédible commence par ses garde-fous.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
            La qualité ici ne repose pas sur des effets de style. Elle repose sur une architecture pédagogique nette,
            sur des limites explicites et sur une confiance qui se voit dans l{'\u2019'}interface.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5 md:grid-cols-3">
            {TRUST_BLOCKS.map((block) => (
              <article key={block.title} className="rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface-secondary)] text-[var(--c-primary)]">
                  <block.icon className="h-5 w-5" />
                </div>
                <h3 style={EDITORIAL_HEADING} className="mt-5 text-2xl leading-tight tracking-[-0.03em] text-white">
                  {block.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">{block.description}</p>
              </article>
            ))}
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-[var(--c-primary-active)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Garantie Nexus
            </div>
            <h3 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-white">
              Ce que l{'\u2019'}interface rend explicite dès la page d{'\u2019'}accueil.
            </h3>
            <div className="mt-6 space-y-3">
              {[
                'Pas de rédaction intégrale de copie à la place de l’élève.',
                'Citations internes affichables quand le corpus est mobilisé.',
                'Parcours aligné sur les œuvres officielles et les attendus EAF.',
                'Sécurité d’accès et respect des comptes mineurs assumés dans le produit.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                  <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
