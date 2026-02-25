import Link from 'next/link';

export default function BienvenuePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.2),transparent_45%),linear-gradient(120deg,#f8fafc,#eef2f7)] dark:bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.22),transparent_45%),linear-gradient(120deg,#0b1220,#0f172a)]">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-4">
          <p className="inline-block text-xs uppercase tracking-widest border border-border rounded-full px-3 py-1">Préparation EAF Première</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-4xl">EAF Premium, votre plateforme de révision guidée pour réussir l épreuve anticipée de français.</h1>
          <p className="text-muted-foreground max-w-2xl">Ateliers oral et écrit, parcours adaptatif, quiz ciblés et ressources officielles organisées pour progresser semaine après semaine.</p>
          <Link href="/login" className="inline-flex px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:scale-[1.02] transition-transform">Commencer</Link>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          {[
            ['Atelier écrit IA', 'Sujet blanc, dépôt de copie, correction détaillée avec rubriques officielles.'],
            ['Oral conversationnel', 'Simulation étape par étape avec feedback structuré et relances.'],
            ['Bibliothèque enrichie', 'Fiches méthode, textes officiels, vidéos et podcasts filtrables.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-xl border border-border bg-card/80 backdrop-blur p-5 hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground mt-2">{text}</p>
            </article>
          ))}
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {[
            ['Lina, élève de Première', 'J ai gagné 3 points en commentaire en 6 semaines grâce au suivi précis.'],
            ['M. Dubois, parent', 'Le tableau de progression est clair et rassurant, on sait quoi travailler.'],
            ['Mme Martin, professeure', 'Les retours sur la méthode sont cohérents avec les attendus EAF.'],
          ].map(([name, text]) => (
            <blockquote key={name} className="rounded-xl border border-border bg-background/80 p-5">
              <p className="text-sm">“{text}”</p>
              <footer className="text-xs text-muted-foreground mt-2">{name}</footer>
            </blockquote>
          ))}
        </section>
      </div>
    </main>
  );
}
