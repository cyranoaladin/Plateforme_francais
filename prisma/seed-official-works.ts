/**
 * Seed OfficialWork table with EAF works for school year 2025-2026.
 * Run: npx tsx prisma/seed-official-works.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKS_2025_2026 = [
  { anneeScolaire: '2025-2026', oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', parcours: 'Émancipations créatrices', objetEtude: 'Poésie', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'La rage de l\u2019expression', auteur: 'Francis Ponge', parcours: 'Dans l\u2019atelier du poète', objetEtude: 'Poésie', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Mes forêts', auteur: 'Hélène Dorion', parcours: 'La poésie, la nature, l\u2019intime', objetEtude: 'Poésie', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Discours de la servitude volontaire', auteur: 'Étienne de La Boétie', parcours: 'Défendre et entretenir la liberté', objetEtude: 'Littérature d\u2019idées', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Entretiens sur la pluralité des mondes', auteur: 'Fontenelle', parcours: 'Le goût de la science', objetEtude: 'Littérature d\u2019idées', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: "Lettres d\u2019une Péruvienne", auteur: 'Françoise de Graffigny', parcours: 'Un nouvel univers s\u2019est offert à mes yeux', objetEtude: 'Littérature d\u2019idées', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Le Menteur', auteur: 'Pierre Corneille', parcours: 'Mensonge et comédie', objetEtude: 'Théâtre', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'On ne badine pas avec l\u2019amour', auteur: 'Alfred de Musset', parcours: 'Les jeux du cœur et de la parole', objetEtude: 'Théâtre', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute', parcours: 'Théâtre et dispute', objetEtude: 'Théâtre', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Manon Lescaut', auteur: 'Abbé Prévost', parcours: 'Personnages en marge, plaisirs du romanesque', objetEtude: 'Roman', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'La Peau de chagrin', auteur: 'Honoré de Balzac', parcours: 'Les romans de l\u2019énergie : création et destruction', objetEtude: 'Roman', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Sido suivi de Les Vrilles de la vigne', auteur: 'Colette', parcours: 'La célébration du monde', objetEtude: 'Roman', voie: 'generale' },
] as const;

async function main() {
  for (const work of WORKS_2025_2026) {
    await prisma.officialWork.upsert({
      where: {
        anneeScolaire_oeuvre: {
          anneeScolaire: work.anneeScolaire,
          oeuvre: work.oeuvre,
        },
      },
      update: {
        ...work,
        urlBO: 'BO n°30 du 24 juillet 2025 (œuvres maintenues) + programmation 2024 pour roman',
      },
      create: {
        ...work,
        urlBO: 'BO n°30 du 24 juillet 2025 (œuvres maintenues) + programmation 2024 pour roman',
      },
    });
  }

  const count = await prisma.officialWork.count({ where: { anneeScolaire: '2025-2026' } });
  console.log(`Done. ${count} official works seeded for 2025-2026.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
