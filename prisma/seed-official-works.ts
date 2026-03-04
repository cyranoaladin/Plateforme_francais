/**
 * Seed OfficialWork table with EAF works for school year 2025-2026.
 * Run: npx tsx prisma/seed-official-works.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKS_2025_2026 = [
  { anneeScolaire: '2025-2026', oeuvre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', parcours: 'Emancipations creatrices', objetEtude: 'Poesie', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'La rage de l expression', auteur: 'Francis Ponge', parcours: 'Dans l atelier du poete', objetEtude: 'Poesie', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Mes forets', auteur: 'Helene Dorion', parcours: 'La poesie, la nature, l intime', objetEtude: 'Poesie', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Discours de la servitude volontaire', auteur: 'Etienne de La Boetie', parcours: 'Defendre et entretenir la liberte', objetEtude: 'Litterature d idees', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Entretiens sur la pluralite des mondes', auteur: 'Fontenelle', parcours: 'Le gout de la science', objetEtude: 'Litterature d idees', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: "Lettres d une Peruvienne", auteur: 'Francoise de Graffigny', parcours: 'Un nouvel univers s est offert a mes yeux', objetEtude: 'Litterature d idees', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Le Menteur', auteur: 'Pierre Corneille', parcours: 'Mensonge et comedie', objetEtude: 'Theatre', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'On ne badine pas avec l amour', auteur: 'Alfred de Musset', parcours: 'Les jeux du coeur et de la parole', objetEtude: 'Theatre', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute', parcours: 'Theatre et dispute', objetEtude: 'Theatre', voie: 'generale' },

  { anneeScolaire: '2025-2026', oeuvre: 'Manon Lescaut', auteur: 'Abbe Prevost', parcours: 'Personnages en marge, plaisirs du romanesque', objetEtude: 'Roman', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'La Peau de chagrin', auteur: 'Honore de Balzac', parcours: 'Les romans de l energie : creation et destruction', objetEtude: 'Roman', voie: 'generale' },
  { anneeScolaire: '2025-2026', oeuvre: 'Sido suivi de Les Vrilles de la vigne', auteur: 'Colette', parcours: 'La celebration du monde', objetEtude: 'Roman', voie: 'generale' },
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
        urlBO: 'BO n30 du 24 juillet 2025 (oeuvres maintenues) + programmation 2024 pour roman',
      },
      create: {
        ...work,
        urlBO: 'BO n30 du 24 juillet 2025 (oeuvres maintenues) + programmation 2024 pour roman',
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
