/**
 * FooterCTA — Final conversion section before site footer.
 * Dependencies: ./CountdownBadge
 */
import Link from 'next/link';
import { CountdownBadge } from './CountdownBadge';

export function FooterCTA() {
  return (
    <section
      className="bg-violet-600 px-4 py-20 text-center"
      aria-label="Dernière chance — inscription gratuite"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center">
          <CountdownBadge className="border-violet-400 bg-violet-500 text-white [&_svg]:text-white" />
        </div>

        <h2 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
          Le meilleur moment pour commencer,
          <br />
          c&apos;est maintenant.
        </h2>

        <p className="mb-8 text-base text-violet-200 sm:text-lg">
          Chaque jour sans entraînement, c&apos;est un point de moins
          à l&apos;oral. Le Freemium est gratuit, sans carte bancaire,
          et tu peux commencer en 3 minutes.
        </p>

        <Link
          href="/login?mode=register"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-violet-600 shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600"
          aria-label="Commencer gratuitement sur Nexus Réussite — sans carte bancaire"
        >
          Commencer gratuitement — sans carte bancaire →
        </Link>

        <p className="mt-4 text-sm text-violet-300">
          Freemium illimité en temps • Aucun engagement
        </p>
      </div>
    </section>
  );
}
