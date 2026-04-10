import { BookOpen } from 'lucide-react';

type OralHeroProps = {
  isSimulation: boolean;
};

export function OralHero({ isSimulation }: OralHeroProps) {
  return (
    <section className="hero-premium-panel relative overflow-hidden rounded-[var(--radius-2xl)] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
      <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
        <div>
          <div className="hero-kicker">
            <BookOpen className="h-4 w-4" />
            Oral EAF
          </div>
          <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
            Une simulation officielle pensée comme un espace d’entraînement, pas comme un outil brut.
          </h1>
          <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
            Tirage, préparation, passage puis bilan. Tout est réuni dans un seul espace pour te garder concentré sur la qualité de ta prise de parole, la précision des attendus officiels et les points à retravailler la séance suivante.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {[
            { label: 'Préparation', value: isSimulation ? '30 min' : 'Libre' },
            { label: 'Passage', value: isSimulation ? '20 min' : 'Libre' },
            { label: 'Barème', value: '2 + 8 + 2 + 8' },
          ].map((item) => (
            <div key={item.label} className="hero-glass-card rounded-[var(--radius-2xl)] px-4 py-4">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
