import { CheckCheck, LockKeyhole, Quote, ShieldCheck, UserRoundCheck } from '@/components/ui/icons';

const TRUST_BLOCKS = [
  {
    icon: Quote,
    title: 'Sources visibles, jamais opaques',
    description: 'Quand le corpus intervient, l\'élève voit ce qui fonde la réponse : BO, Eduscol, rapports de jury, œuvres au programme.',
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
    <section 
      id="securite" 
      className="scroll-mt-24 py-20 md:py-24"
      style={{ background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)' }}
    >
      {/* Decorative orb */}
      <div 
        className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px]"
        style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
      />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-gold)]">Engagements non négociables</p>
            <h2 
              className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl"
              style={{ fontFamily: 'var(--eaf-font-display)' }}
            >
              Une plateforme commerciale crédible commence par ses garde-fous.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--eaf-text-secondary)] sm:text-base">
            La qualité ici ne repose pas sur des effets de style. Elle repose sur une architecture pédagogique nette,
            sur des limites explicites et sur une confiance qui se voit dans l&apos;interface.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5 md:grid-cols-3">
            {TRUST_BLOCKS.map((block) => (
              <article 
                key={block.title} 
                className="rounded-[var(--eaf-radius-2xl)] border p-6"
                style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
              >
                <div 
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--eaf-orange)]"
                  style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                >
                  <block.icon className="h-5 w-5" />
                </div>
                <h3 
                  className="mt-5 text-2xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)]"
                  style={{ fontFamily: 'var(--eaf-font-display)' }}
                >
                  {block.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--eaf-text-secondary)]">{block.description}</p>
              </article>
            ))}
          </div>

          <aside 
            className="rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md md:p-7"
            style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
          >
            <div 
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]"
              style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Garantie Nexus
            </div>
            <h3 
              className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)]"
              style={{ fontFamily: 'var(--eaf-font-display)' }}
            >
              Ce que l&apos;interface rend explicite dès la page d&apos;accueil.
            </h3>
            <div className="mt-6 space-y-3">
              {[
                'Pas de rédaction intégrale de copie à la place de l\'élève.',
                'Citations internes affichables quand le corpus est mobilisé.',
                'Parcours aligné sur les œuvres officielles et les attendus EAF.',
                'Sécurité d\'accès et respect des comptes mineurs assumés dans le produit.',
              ].map((item) => (
                <div 
                  key={item} 
                  className="flex items-start gap-3 rounded-[var(--eaf-radius-xl)] border px-4 py-3"
                  style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                >
                  <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--eaf-gold)]" />
                  <p className="text-sm leading-6 text-[var(--eaf-text-secondary)]">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
