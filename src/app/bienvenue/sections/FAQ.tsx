'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'L\'IA peut-elle écrire à ma place ?',
    answer: 'Non. Elle guide et structure, sans produire une copie complète. Si tu demandes un commentaire entier, elle refuse et propose une méthode pour le construire toi-même.',
  },
  {
    question: 'Sur quelles sources s\'appuie-t-elle ?',
    answer: 'BO, Eduscol et œuvres au programme 2025-2026. Les citations sont visibles dans chaque réponse du tuteur IA.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer: 'Session sécurisée (cookie HttpOnly) + protection CSRF + contrôle d\'accès. Données hébergées en Europe, conformité RGPD. Consentement parental requis pour les mineurs.',
  },
  {
    question: 'Et si je suis dys / TDAH ?',
    answer: 'Navigation clavier complète, contrastes conformes WCAG AA, et mode dyslexie (police OpenDyslexic, espacement augmenté) disponible dans le profil.',
  },
  {
    question: 'Que faire si je bloque ?',
    answer: 'Consulte la FAQ dans ton profil ou contacte le support (selon ton plan). Le tuteur IA peut aussi reformuler ses explications si tu lui demandes.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm md:text-base pr-4">{question}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-foreground">Questions fréquentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
