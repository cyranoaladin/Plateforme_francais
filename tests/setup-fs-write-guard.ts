/**
 * Global regression guard: fails the test run if a test performs a real
 * filesystem write into a production-shaped uploads path.
 *
 * Background: tests/unit/correction/report-generator.test.ts used to call
 * generateRapportEcritDocument() with no filesystem mocking, which wrote a
 * real HTML file to `<cwd>/.data/uploads/documents/<userId>/...` on every
 * test run (the default local-storage layout, structurally identical to
 * production's /opt/eaf/shared/uploads/documents/<userId>/...). Over many
 * runs this leaked hundreds of stray files onto disk. That specific test is
 * now fixed to mock `fs`, but this guard exists so that *any* future test —
 * not just that one — cannot silently reintroduce the same class of leak.
 *
 * Any write whose target path matches a known production-shaped uploads
 * pattern throws immediately, failing the test loudly instead of silently
 * touching disk. There is deliberately no "allow under os.tmpdir()" escape
 * hatch: a checkout can itself live under a temp directory (e.g. a CI
 * workspace or a disposable clone), so the only reliable signal is the
 * shape of the target path itself, not where the process happens to run.
 */
// A default import (not `import * as fsReal`) is required here: the star
// namespace form yields an ES module namespace object whose properties are
// non-writable/non-configurable per spec, so patching it throws
// "TypeError: Cannot redefine property". The default import instead resolves
// to the mutable exports object that every call site's
// `import { promises as fs } from 'fs'` reads from — so patching methods on
// it here is visible everywhere within the same module registry. We import
// from the bare specifier 'fs' (not 'node:fs') to match exactly what
// src/lib/pdf/generator.ts imports, since Vitest's module runner can treat
// the two specifiers as separate cache entries.
import fsReal from 'fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\/opt\/eaf(\/|$)/, // production deployment root, any release/shared path
  /(^|\/)shared\/uploads(\/|$)/, // production shared uploads tree
  /(^|\/)\.data\/uploads(\/|$)/, // local dev/test default uploads tree (COPIES_DIR fallback)
];

function isForbidden(target: string): boolean {
  const resolved = path.resolve(target);
  return FORBIDDEN_PATTERNS.some((re) => re.test(resolved));
}

function guardSync<T extends (...args: any[]) => any>(name: string, original: T): T {
  return function guarded(this: unknown, ...args: Parameters<T>) {
    const target = args[0];
    if (typeof target === 'string' && isForbidden(target)) {
      throw new Error(
        `[fs-write-guard] Blocked real filesystem write via fs.${name}() to a ` +
          `production-shaped path: "${target}". Tests must mock the 'fs' module ` +
          `instead of touching real storage paths. This guard exists because an ` +
          `unmocked write previously leaked hundreds of files onto disk via ` +
          `tests/unit/correction/report-generator.test.ts.`,
      );
    }
    return original.apply(this, args);
  } as T;
}

// Patch both the sync and promise-based write APIs on the shared 'fs'
// exports object so any call site (including ones that only import
// `{ promises as fs } from 'fs'`) goes through the guard.
fsReal.writeFileSync = guardSync('writeFileSync', fsReal.writeFileSync);
fsReal.mkdirSync = guardSync('mkdirSync', fsReal.mkdirSync);
fsReal.appendFileSync = guardSync('appendFileSync', fsReal.appendFileSync);
fsReal.promises.writeFile = guardSync('promises.writeFile', fsReal.promises.writeFile);
fsReal.promises.mkdir = guardSync('promises.mkdir', fsReal.promises.mkdir);
fsReal.promises.appendFile = guardSync('promises.appendFile', fsReal.promises.appendFile);
