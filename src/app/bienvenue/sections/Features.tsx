import { PenTool, Mic, Brain, BookOpen, Search, MessageCircle } from 'lucide-react';

const FEATURES = [
  {
    icon: PenTool,
    title: 'Atelier écrit',
    description: 'Je dépose une copie (PDF/image) : OCR, correction et rapport PDF.',
  },
  {
    icon: Mic,
    title: 'Atelier oral',
    description: 'Simulation 4 phases : lecture, explication, grammaire, entretien.',
  },
  {
    icon: Brain,
    title: 'Atelier langue',
    description: 'Exercices ciblés, feedback immédiat.',
  },
  {
    icon: BookOpen,
    title: 'Quiz adaptatif',
    description: 'Si < 60 %, le thème devient une priorité de travail.',
  },
  {
    icon: Search,
    title: 'Bibliothèque + RAG',
    description: 'Recherche documentée, citations visibles.',
  },
  {
    icon: MessageCircle,
    title: 'Tuteur IA',
    description: 'Aide méthodologique + refus pédagogique si demande de copie.',
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-foreground">
          Tout ce qu&apos;il faut pour réussir l&apos;EAF
        </h2>
        <p className="text-muted-foreground text-center mt-2 text-base leading-7 max-w-xl mx-auto">
          Chaque fonctionnalité est conçue pour te faire travailler activement, pas pour produire à ta place.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {FEATURES.map((feat) => (
            <article
              key={feat.title}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground">{feat.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feat.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
