import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIRS = [
  'src/app/dashboard',
  'src/components/layout',
  'src/components/ui',
];

const CURLY_OPEN  = '\u2018';
const CURLY_CLOSE = '\u2019';
const CURLY_DOPEN = '\u201C';
const CURLY_DCLOSE = '\u201D';

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) files.push(full);
  }
  return files;
}

let errors = 0;
for (const dir of DIRS) {
  try {
    for (const file of walk(dir)) {
      const lines = readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, i) => {
        // Only flag curly quotes INSIDE className="..." or accent: '...' values
        // Extract string values from className= and accent: props
        const propStrings = line.match(/className="[^"]*"|className='[^']*'|accent:\s*'[^']*'|accent:\s*"[^"]*"|tone:\s*'[^']*'|variant:\s*'[^']*'/g);
        if (propStrings) {
          for (const ps of propStrings) {
            if (ps.includes(CURLY_OPEN) || ps.includes(CURLY_CLOSE) ||
                ps.includes(CURLY_DOPEN) || ps.includes(CURLY_DCLOSE)) {
              console.error(`Curly quote in prop: ${file}:${i + 1}`);
              console.error(`   ${ps.slice(0, 80)}`);
              errors++;
            }
          }
        }
      });
    }
  } catch { /* dir absent */ }
}

if (errors === 0) {
  console.log('check-curly-quotes: 0 typographic quote in props');
  process.exit(0);
} else {
  console.error(`${errors} typographic quote(s) in props`);
  process.exit(1);
}
