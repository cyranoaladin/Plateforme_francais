/**
 * FooterCTA — Final conversion section before site footer.
 * Dependencies: ./CountdownBadge
 */
import Link from 'next/link';
import { CountdownBadge } from './CountdownBadge';
import { ROUTES } from '@/lib/routes';

export function FooterCTA() {
  return (
    <section
      className="bg-brand px-6 py-16 text-center sm:py-20"
      aria-label="Dernière chance — inscription gratuite"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center">
          <CountdownBadge className="border-[var(--color-indigo-400)] bg-brand-hover text-white [&_svg]:text-white" />
        </div>

        <h2 className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          Le meilleur moment pour commencer,
          <br />
          c'est maintenant.
        </h2>

        <p className="mb-8 text-base text-[var(--color-indigo-200)] sm:text-lg">
          Chaque jour sans entraînement, c'est un point de moins
          à l'oral. Le Freemium est gratuit, sans carte bancaire,
          et tu peux commencer en 3 minutes.
        </p>

        <Link
          href={ROUTES.register}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface px-8 py-4 text-base font-semibold text-brand shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand sm:w-auto"
        >
          Commencer gratuitement — sans carte bancaire →
        </Link>

        <p className="mt-4 text-sm text-[var(--color-indigo-300)]">
          Freemium illimité en temps • Aucun engagement
        </p>
      </div>
    </section>
  );
}
