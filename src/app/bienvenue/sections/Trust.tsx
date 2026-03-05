import { FileCheck, Shield, Lock } from 'lucide-react';

const TRUST_BLOCKS = [
  {
    icon: FileCheck,
    title: 'Coaching actif',
    description: 'Pas de leçon magistrale : on s\'entraîne. L\'IA structure, guide et corrige — tu produis.',
  },
  {
    icon: Shield,
    title: 'Anti-copier-coller',
    description: 'La plateforme refuse de produire un commentaire ou une dissertation à ta place. Elle propose une alternative constructive.',
  },
  {
    icon: Lock,
    title: 'Fiabilité institutionnelle',
    description: 'Toutes les corrections s\'appuient sur le BO, Eduscol et les œuvres au programme. Les réponses citent leurs sources.',
  },
];

export function Trust() {
  return (
    <section id="securite" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-foreground">
          Pourquoi c&apos;est fiable&nbsp;?
        </h2>
        <p className="text-muted-foreground text-center mt-2 text-base leading-7">
          Conformité, éthique pédagogique et sécurité par défaut.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {TRUST_BLOCKS.map((block) => (
            <div key={block.title} className="rounded-2xl border border-border bg-card p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <block.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-foreground text-lg">{block.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{block.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
