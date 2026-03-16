'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MessageSquareText } from 'lucide-react';

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const FAQ_ITEMS = [
  {
    question: 'La plateforme peut-elle écrire à ma place ?',
    answer: 'Non. Le produit est conçu pour guider, structurer et corriger. Les demandes de commentaire ou de dissertation complets sont refusées et remplacées par une aide méthodologique exploitable.',
  },
  {
    question: 'Sur quelles sources s’appuie la plateforme ?',
    answer: 'Le corpus mobilisable s’appuie sur les sources institutionnelles, les rapports de jury et les œuvres au programme. Quand une réponse utilise ce corpus, elle expose des références internes visibles et réutilisables.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer: 'Oui. Session sécurisée, protection CSRF, contrôle d’accès, cadre RGPD et posture explicite sur les comptes mineurs : l’architecture de confiance fait partie du produit, pas d’un simple texte légal.',
  },
  {
    question: 'Et si je suis dys / TDAH ?',
    answer: 'Le produit conserve une logique accessible : navigation clavier, contrastes lisibles, mode dyslexie et structure de page plus aérée pour réduire la charge cognitive.',
  },
  {
    question: 'Que se passe-t-il si je bloque ?',
    answer: 'Le guidage reformule, le parcours relance les priorités et la page tarifaire détaille les niveaux de support disponibles selon les plans. Le but est d’éviter les impasses silencieuses.',
  },
];

function FaqItem({
  question,
  answer,
  index,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[26px] border border-[#d8ccb9] bg-white/85 shadow-[0_14px_35px_rgba(23,50,77,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efe7da] text-xs font-bold text-[#17324d]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="pt-1 text-sm font-semibold text-[#17324d] md:text-base">{question}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
      </button>
      {open ? <div className="px-5 pb-5 pl-[4.75rem] text-sm leading-7 text-slate-600">{answer}</div> : null}
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Questions fréquentes</p>
          <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
            Les objections doivent être traitées avec autant de soin que les promesses.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Une page d&apos;accueil sérieuse répond clairement aux questions sensibles : anti-triche, sources, sécurité, accessibilité, support.
          </p>

          <div className="mt-8 rounded-[30px] border border-[#d8ccb9] bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_18px_45px_rgba(23,50,77,0.15)]">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#e4d4bd]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-white">
              Besoin d&apos;aller plus loin avant de t&apos;inscrire ?
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              La page tarifs détaille les plans et la page connexion permet de démarrer gratuitement pour tester le workflow réel.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm font-semibold">
              <Link href="/pricing" className="transition-colors hover:text-white">Voir les plans détaillés</Link>
              <Link href="/login?mode=register" className="transition-colors hover:text-white">Créer un compte gratuit</Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              index={index}
              open={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
