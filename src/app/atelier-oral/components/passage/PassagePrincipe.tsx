import Link from 'next/link';

type Props = {
  oralTutorHref: string;
};

export function PassagePrincipe({ oralTutorHref }: Props) {
  return (
    <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">
        Principe de séance
      </p>
      <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
        Mieux vaut quatre prises de parole nettes avec un vrai retour intermédiaire qu’une longue réponse confuse.
      </p>
      <Link
        href={oralTutorHref}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
      >
        Reprendre cette phase avec le guidage
      </Link>
    </section>
  );
}
