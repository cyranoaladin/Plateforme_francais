import { BookOpen } from '@/components/ui/icons';

type OralHeroProps = {
  isSimulation: boolean;
};

export function OralHero({ isSimulation }: OralHeroProps) {
  // Déterminer les valeurs des stats selon le mode
  const prepValue = isSimulation ? '30 min' : 'Libre';
  const passageValue = isSimulation ? '20 min' : 'Libre';

  return (
    <section
      className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10"
      style={{
        background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
        border: '1px solid rgba(123, 142, 255, 0.15)',
      }}
    >
      {/* Glow effects */}
      <div
        className="absolute -right-[5%] top-1/2 hidden h-[60%] w-[30%] -translate-y-1/2 rounded-full blur-3xl lg:block"
        style={{ background: 'radial-gradient(circle at center, rgba(123, 142, 255, 0.12), transparent 70%)' }}
      />
      <div
        className="absolute -left-[3%] -top-[15%] h-36 w-36 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle at center, rgba(26, 213, 160, 0.12), transparent 60%)' }}
      />

      <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{
              background: 'rgba(123, 142, 255, 0.12)',
              color: 'var(--eaf-indigo)',
            }}
          >
            <BookOpen className="h-4 w-4" />
            Atelier oral
          </div>
          <h1
            className="mt-5 max-w-4xl text-4xl leading-tight text-white md:text-[44px]"
            style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
          >
            Une simulation officielle pensée comme un espace d'entraînement, pas comme un outil brut.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Tirage, préparation, passage puis bilan. Tout est réuni dans un seul espace pour te garder concentré sur la qualité de ta prise de parole, la précision des attendus officiels et les points à retravailler la séance suivante.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Préparation', value: prepValue, color: 'gold' as const },
            { label: 'Passage', value: passageValue, color: 'indigo' as const },
            { label: 'Barème', value: '2 + 8 + 2 + 8', color: 'teal' as const },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl px-4 py-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: `var(--eaf-${item.color})` }}
              >
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
