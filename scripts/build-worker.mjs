import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outFile = path.join(projectRoot, 'dist', 'worker', 'src', 'lib', 'queue', 'start-worker.js');
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const external = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
];

await build({
  entryPoints: [path.join(projectRoot, 'src', 'lib', 'queue', 'start-worker.ts')],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: false,
  tsconfig: path.join(projectRoot, 'tsconfig.worker.json'),
  external,
  alias: {
    '@': path.join(projectRoot, 'src'),
  },
});

console.log(`[build:worker] compiled worker entry at ${outFile}`);
