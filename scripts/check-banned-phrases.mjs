import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baselinePath = path.resolve(__dirname, '../config/fr-copy-baseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

const violations = Array.isArray(baseline.violations)
  ? baseline.violations.filter((item) => item.kind === 'banned-phrase')
  : [];

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} banned-phrase(s) dans le code :`);
  violations.forEach((violation) => {
    console.error(`  ${violation.file}:${violation.line} → "${violation.text}"`);
  });
  process.exit(1);
}

console.log('✅ Aucune banned-phrase détectée');
