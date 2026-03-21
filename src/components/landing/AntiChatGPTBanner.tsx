/**
 * AntiChatGPTBanner — Standalone differentiator section (dark background).
 * Dependencies: none — stateless component
 */

import Link from 'next/link';

const CHATGPT_ITEMS = [
  "Rédige à ta place — copie détectable par le correcteur",
  "Sources internet non vérifiées, hors corpus officiel",
  "Aucune simulation d'oral au barème /2 /8 /2 /8",
  "Aucune mémoire de ta progression d'une session à l'autre",
];

const NEXUS_ITEMS = [
  "Guide sans jamais rédiger — travail original et inimitable",
  "BO 2026, Eduscol et rapports de jury officiels uniquement",
  "Oral simulé noté /2 /8 /2 /8 comme le vrai examinateur",
  "Parcours adaptatif mémorisé et ajusté à chaque session",
];

function XIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

function ComparisonColumn({
  title,
  variant,
  items,
}: {
  title: string;
  variant: 'danger' | 'success';
  items: string[];
}) {
  const headerClass =
    variant === 'danger'
      ? 'bg-red-950 text-red-300 border-b border-red-800'
      : 'bg-violet-950 text-violet-300 border-b border-violet-700 ring-1 ring-violet-600';

  const Icon = variant === 'danger' ? XIcon : CheckIcon;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className={`px-5 py-3 text-sm font-semibold ${headerClass}`}>{title}</div>
      <div className="space-y-4 bg-white/5 p-5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <Icon />
            <span className="text-sm leading-relaxed text-gray-300">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AntiChatGPTBanner() {
  return (
    <section className="bg-gray-950 px-4 py-20" aria-label="Pourquoi pas ChatGPT ?">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-violet-400">
          Pourquoi pas ChatGPT ?
        </p>

        <h2 className="mb-6 text-center text-3xl font-bold leading-tight text-white sm:text-4xl">
          ChatGPT rédige.{' '}
          <span className="text-violet-400">Nexus t&apos;apprend.</span>
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-center text-base leading-relaxed text-gray-300 sm:text-lg">
          Un élève qui copie-colle ChatGPT est immédiatement repéré
          par le correcteur — et sanctionné. Nexus ne rédige jamais :
          il pose des questions, cite les sources officielles, et te
          force à construire TON raisonnement. Le résultat est
          inimitable, parce qu&apos;il vient de toi.
        </p>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ComparisonColumn title="ChatGPT / IA générique" variant="danger" items={CHATGPT_ITEMS} />
          <ComparisonColumn title="Nexus Réussite" variant="success" items={NEXUS_ITEMS} />
        </div>

        <div className="text-center">
          <Link
            href="/login?mode=register"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-900/30 transition-colors hover:bg-violet-500"
            aria-label="Commencer gratuitement sur Nexus Réussite"
          >
            Essayer gratuitement — sans carte bancaire →
          </Link>
        </div>
      </div>
    </section>
  );
}
