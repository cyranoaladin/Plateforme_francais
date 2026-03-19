import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export type CopyViolationKind = 'jsx-text' | 'jsx-prop' | 'api-message' | 'banned-phrase';

export type CopyViolation = {
  file: string;
  line: number;
  column: number;
  kind: CopyViolationKind;
  text: string;
};

type DetectParams = {
  filePath: string;
  source: string;
  bannedPhrases: string[];
};

type BaselineFile = {
  generatedAt: string;
  violations: CopyViolation[];
};

const USER_FACING_PROPS = new Set([
  'placeholder',
  'title',
  'aria-label',
  'label',
  'description',
  'error',
  'message',
  'emptyState',
  'cta',
]);

const API_MESSAGE_KEYS = new Set(['error', 'message', 'title', 'description']);

const DEFAULT_SCAN_TARGETS = [
  'src/app',
  'src/components',
  'src/lib/billing/copy.ts',
  'src/lib/billing/library-gating.ts',
  'src/lib/billing/quotas.ts',
] as const;

const BANNED_PHRASES_PATH = path.resolve(process.cwd(), 'config/fr-copy-banned-phrases.json');
const BASELINE_PATH = path.resolve(process.cwd(), 'config/fr-copy-baseline.json');

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function looksUserFacingText(value: string): boolean {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return false;
  if (normalized.length < 2) return false;
  return /[A-Za-zÀ-ÿ]/.test(normalized);
}

function toRelativeFile(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function makeViolation(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  kind: CopyViolationKind,
  text: string,
  overrideFile?: string,
): CopyViolation {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: overrideFile ?? toRelativeFile(sourceFile.fileName),
    line: line + 1,
    column: character + 1,
    kind,
    text: normalizeWhitespace(text),
  };
}

export function detectFrCopyViolations(params: DetectParams): CopyViolation[] {
  const sourceFile = ts.createSourceFile(
    params.filePath,
    params.source,
    ts.ScriptTarget.Latest,
    true,
    params.filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const violations: CopyViolation[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = normalizeWhitespace(node.getText(sourceFile));
      if (looksUserFacingText(text)) {
        violations.push(makeViolation(sourceFile, node, 'jsx-text', text, params.filePath));
      }
    }

    if (ts.isJsxAttribute(node) && USER_FACING_PROPS.has(node.name.text) && node.initializer) {
      if (ts.isStringLiteral(node.initializer) && looksUserFacingText(node.initializer.text)) {
        violations.push(makeViolation(sourceFile, node.initializer, 'jsx-prop', node.initializer.text, params.filePath));
      } else if (ts.isJsxExpression(node.initializer)) {
        const expression = node.initializer.expression;
        if (expression && ts.isStringLiteral(expression) && looksUserFacingText(expression.text)) {
          violations.push(makeViolation(sourceFile, expression, 'jsx-prop', expression.text, params.filePath));
        }
      }
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'json') {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
        for (const property of firstArg.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const propertyName = property.name.getText(sourceFile).replace(/['"]/g, '');
          if (!API_MESSAGE_KEYS.has(propertyName)) continue;

          const initializer = property.initializer;
          if (ts.isStringLiteral(initializer) && looksUserFacingText(initializer.text)) {
            violations.push(makeViolation(sourceFile, initializer, 'api-message', initializer.text, params.filePath));
          }
          if (ts.isNoSubstitutionTemplateLiteral(initializer) && looksUserFacingText(initializer.text)) {
            violations.push(makeViolation(sourceFile, initializer, 'api-message', initializer.text, params.filePath));
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  for (const phrase of params.bannedPhrases) {
    let startIndex = params.source.indexOf(phrase);
    while (startIndex >= 0) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(startIndex);
      violations.push({
        file: params.filePath,
        line: line + 1,
        column: character + 1,
        kind: 'banned-phrase',
        text: phrase,
      });
      startIndex = params.source.indexOf(phrase, startIndex + phrase.length);
    }
  }

  return violations;
}

export function filterBaselineViolations(
  violations: CopyViolation[],
  baseline: CopyViolation[],
): CopyViolation[] {
  const baselineKeys = new Set(
    baseline.map((entry) => `${entry.file}:${entry.line}:${entry.column}:${entry.kind}:${entry.text}`),
  );

  return violations.filter(
    (violation) =>
      !baselineKeys.has(
        `${violation.file}:${violation.line}:${violation.column}:${violation.kind}:${violation.text}`,
      ),
  );
}

function shouldScanFile(relativeFile: string): boolean {
  if (!/\.(ts|tsx)$/.test(relativeFile)) return false;
  if (relativeFile.includes('/__tests__/') || relativeFile.includes('.test.')) return false;
  if (relativeFile.startsWith('src/lib/copy/fr/')) return false;
  return true;
}

function collectFiles(targetPath: string, acc: string[]) {
  if (!existsSync(targetPath)) return;
  const stat = statSync(targetPath);

  if (stat.isFile()) {
    const relative = toRelativeFile(targetPath);
    if (shouldScanFile(relative)) {
      acc.push(relative);
    }
    return;
  }

  for (const entry of readdirSync(targetPath)) {
    collectFiles(path.join(targetPath, entry), acc);
  }
}

export function loadBannedPhrases(bannedPhrasesPath = BANNED_PHRASES_PATH): string[] {
  const raw = readFileSync(bannedPhrasesPath, 'utf8');
  const parsed = JSON.parse(raw) as { phrases?: string[] };
  return parsed.phrases ?? [];
}

export function loadBaseline(baselinePath = BASELINE_PATH): CopyViolation[] {
  if (!existsSync(baselinePath)) return [];
  const raw = readFileSync(baselinePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<BaselineFile>;
  return parsed.violations ?? [];
}

export function scanRepository(options?: {
  rootDir?: string;
  bannedPhrases?: string[];
  targets?: readonly string[];
}): CopyViolation[] {
  const rootDir = options?.rootDir ?? process.cwd();
  const bannedPhrases = options?.bannedPhrases ?? loadBannedPhrases();
  const targets = options?.targets ?? DEFAULT_SCAN_TARGETS;

  const files: string[] = [];
  for (const target of targets) {
    collectFiles(path.resolve(rootDir, target), files);
  }

  const uniqueFiles = [...new Set(files)].sort();
  return uniqueFiles.flatMap((relativeFile) => {
    const absoluteFile = path.resolve(rootDir, relativeFile);
    const source = readFileSync(absoluteFile, 'utf8');
    return detectFrCopyViolations({
      filePath: relativeFile,
      source,
      bannedPhrases,
    });
  });
}

export function writeBaseline(
  violations: CopyViolation[],
  baselinePath = BASELINE_PATH,
) {
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  const payload: BaselineFile = {
    generatedAt: new Date().toISOString(),
    violations: [...violations].sort((a, b) =>
      `${a.file}:${a.line}:${a.column}:${a.kind}:${a.text}`.localeCompare(
        `${b.file}:${b.line}:${b.column}:${b.kind}:${b.text}`,
      ),
    ),
  };
  writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export function runCli(args = process.argv.slice(2)): number {
  const writeMode = args.includes('--write-baseline');
  const bannedPhrases = loadBannedPhrases();
  const violations = scanRepository({ bannedPhrases });

  if (writeMode) {
    writeBaseline(violations);
    console.log(`Baseline FR écrite: ${violations.length} violation(s) capturées.`);
    return 0;
  }

  const baseline = loadBaseline();
  const unexpectedViolations = filterBaselineViolations(violations, baseline);

  if (unexpectedViolations.length > 0) {
    console.error('Violations FR hors baseline détectées:');
    for (const violation of unexpectedViolations.slice(0, 50)) {
      console.error(`- ${violation.file}:${violation.line}:${violation.column} [${violation.kind}] ${violation.text}`);
    }
    return 1;
  }

  console.log(`Contrôle FR OK: ${violations.length} violation(s) connues absorbées par la baseline.`);
  return 0;
}

const isMainModule = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  process.exitCode = runCli();
}
