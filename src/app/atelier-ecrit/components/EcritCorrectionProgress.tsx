import { STUDIO_STEPS } from '../types';

type Props = {
  epreuveReady: boolean;
  copieReady: boolean;
  reportReady: boolean;
};

export function EcritCorrectionProgress({
  epreuveReady,
  copieReady,
  reportReady,
}: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {STUDIO_STEPS.map((step, index) => {
        const isActive = index === 0 ? !epreuveReady : index === 1 ? epreuveReady && !reportReady : reportReady;
        const isPast = index === 0 ? epreuveReady : index === 1 ? copieReady || reportReady : reportReady;

        return (
          <article
            key={step.index}
            className={`rounded-[var(--radius-2xl)] border px-5 py-5 shadow-[var(--shadow-sm)] transition ${isActive || isPast ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)]'}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">
              Étape {step.index}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{step.body}</p>
          </article>
        );
      })}
    </section>
  );
}
