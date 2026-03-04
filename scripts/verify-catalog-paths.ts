/**
 * scripts/verify-catalog-paths.ts
 * Vérifie que chaque filePath du catalogue pointe vers un fichier existant.
 * Usage : npx ts-node scripts/verify-catalog-paths.ts
 */
import { existsSync } from 'fs';
import path from 'path';
import { MEDIA_CATALOG } from '../src/data/media-catalog';

let ok = 0;
let missing = 0;

for (const entry of MEDIA_CATALOG) {
  const absPath = path.resolve(process.cwd(), entry.filePath);
  if (existsSync(absPath)) {
    ok++;
  } else {
    missing++;
    console.error(`❌ MISSING: ${entry.id}`);
    console.error(`   filePath: ${entry.filePath}`);
  }
}

console.log(`\n✅ Fichiers trouvés : ${ok}`);
console.log(`❌ Fichiers manquants : ${missing}`);

if (missing > 0) {
  console.error('\nCorrigez les filePath manquants dans src/data/media-catalog.ts');
  process.exit(1);
}
