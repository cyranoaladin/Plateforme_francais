import fs from 'node:fs';
import path from 'node:path';

const tsxBinary = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx');

if (!fs.existsSync(tsxBinary)) {
  console.error('[build:worker] Missing tsx runtime. Install production dependencies before starting eaf-worker.');
  process.exit(1);
}

console.log(`[build:worker] tsx runtime available at ${tsxBinary}`);
