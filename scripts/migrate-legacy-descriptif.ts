import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type LegacyTextePrepareRow = {
  id: string;
  userId: string;
  oeuvreAuteur: string;
  titreExtrait: string;
  incipit: string | null;
  position: number | null;
  anneeScolaire: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type LegacyDescriptifTexteRow = {
  id: string;
  studentId: string;
  userId: string;
  objetEtude: string | null;
  oeuvre: string;
  auteur: string;
  typeExtrait: string | null;
  titre: string;
  premieresLignes: string | null;
  createdAt: Date | string;
};

type ObjetEtudeValue = 'POESIE' | 'THEATRE' | 'LITTERATURE_IDEES' | 'ROMAN_RECIT';
type TypeTexteValue =
  | 'EXTRAIT_OEUVRE'
  | 'EXTRAIT_PARCOURS'
  | 'LECTURE_CURSIVE'
  | 'OEUVRE_CHOISIE_ENTRETIEN';

const prisma = new PrismaClient();

const PROGRAMME_AUTHORS: Array<{ pattern: RegExp; objetEtude: ObjetEtudeValue }> = [
  { pattern: /rimbaud|ponge|dorion/i, objetEtude: 'POESIE' },
  { pattern: /corneille|musset|sarraute/i, objetEtude: 'THEATRE' },
  { pattern: /rabelais|la bruy[eè]re|olympe de gouges/i, objetEtude: 'LITTERATURE_IDEES' },
  { pattern: /pr[ée]vost|balzac|colette/i, objetEtude: 'ROMAN_RECIT' },
];

function nowStamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function archiveDirPath(): string {
  return path.join(process.cwd(), '.data', 'migration-backups', `${nowStamp()}_texte_descriptif`);
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS "exists"`,
    tableName,
  );
  return rows[0]?.exists === true;
}

function inferObjetEtude(raw: string | null | undefined): ObjetEtudeValue {
  const source = raw ?? '';
  for (const rule of PROGRAMME_AUTHORS) {
    if (rule.pattern.test(source)) {
      return rule.objetEtude;
    }
  }

  if (/po[eé]sie|vers|sonnet/i.test(source)) return 'POESIE';
  if (/th[eé][aâ]tre|acte|sc[eè]ne/i.test(source)) return 'THEATRE';
  if (/essai|id[ée]es|argument/i.test(source)) return 'LITTERATURE_IDEES';
  return 'ROMAN_RECIT';
}

function inferTypeTexte(raw: string | null | undefined): TypeTexteValue {
  const source = raw ?? '';
  if (/cursive/i.test(source)) return 'LECTURE_CURSIVE';
  if (/entretien|oeuvre choisie|œuvre choisie/i.test(source)) return 'OEUVRE_CHOISIE_ENTRETIEN';
  if (/parcours/i.test(source)) return 'EXTRAIT_PARCOURS';
  return 'EXTRAIT_OEUVRE';
}

async function main() {
  const archiveDir = archiveDirPath();
  mkdirSync(archiveDir, { recursive: true });

  const hasLegacyTextePrepare = await tableExists('_legacy_TextePrepare');
  const hasLegacyDescriptif = await tableExists('_legacy_DescriptifTexte');

  const legacyTextePrepare = hasLegacyTextePrepare
    ? await prisma.$queryRawUnsafe<LegacyTextePrepareRow[]>('SELECT * FROM "_legacy_TextePrepare" ORDER BY "userId", "position", "createdAt"')
    : [];
  const legacyDescriptif = hasLegacyDescriptif
    ? await prisma.$queryRawUnsafe<LegacyDescriptifTexteRow[]>(`
        SELECT d.*, sp."userId"
        FROM "_legacy_DescriptifTexte" d
        JOIN "StudentProfile" sp ON sp."id" = d."studentId"
        ORDER BY sp."userId", d."createdAt"
      `)
    : [];

  writeFileSync(
    path.join(archiveDir, 'legacy-texte-prepare.json'),
    `${JSON.stringify(legacyTextePrepare, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(archiveDir, 'legacy-descriptif-texte.json'),
    `${JSON.stringify(legacyDescriptif, null, 2)}\n`,
    'utf8',
  );

  let migrated = 0;

  for (const row of legacyTextePrepare) {
    const objetEtude = inferObjetEtude(row.oeuvreAuteur);
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "TexteDescriptif" (
        "id", "userId", "objetEtude", "typeTexte", "oeuvreAuteur", "titreExtrait",
        "incipit", "position", "anneeScolaire", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::"ObjetEtude", $4::"TypeTexteDescriptif", $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp
      )
      ON CONFLICT ("id") DO NOTHING
      `,
      row.id,
      row.userId,
      objetEtude,
      'EXTRAIT_OEUVRE',
      row.oeuvreAuteur,
      row.titreExtrait,
      row.incipit,
      row.position ?? 0,
      row.anneeScolaire ?? '2025-2026',
      new Date(row.createdAt).toISOString(),
      new Date(row.updatedAt).toISOString(),
    );
    migrated += 1;
  }

  for (const row of legacyDescriptif) {
    const oeuvreAuteur = [row.oeuvre, row.auteur].filter(Boolean).join(' — ');
    const objetEtude = row.objetEtude
      ? inferObjetEtude(`${row.objetEtude} ${oeuvreAuteur}`)
      : inferObjetEtude(oeuvreAuteur);
    const typeTexte = inferTypeTexte(row.typeExtrait);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "TexteDescriptif" (
        "id", "userId", "objetEtude", "typeTexte", "oeuvreAuteur", "titreExtrait",
        "incipit", "position", "anneeScolaire", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::"ObjetEtude", $4::"TypeTexteDescriptif", $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp
      )
      ON CONFLICT ("id") DO NOTHING
      `,
      row.id,
      row.userId,
      objetEtude,
      typeTexte,
      oeuvreAuteur || row.auteur || 'Œuvre non renseignée',
      row.titre,
      row.premieresLignes,
      0,
      '2025-2026',
      new Date(row.createdAt).toISOString(),
      new Date(row.createdAt).toISOString(),
    );
    migrated += 1;
  }

  console.log(JSON.stringify({
    archiveDir,
    legacyTextePrepare: legacyTextePrepare.length,
    legacyDescriptif: legacyDescriptif.length,
    migrated,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
