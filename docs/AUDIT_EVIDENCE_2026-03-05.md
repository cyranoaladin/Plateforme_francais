# Dossier de preuves d'audit - Nexus EAF

Date UTC de collecte: 2026-03-05T00:03:41Z  
Commit (HEAD court): c0fbeb5

Ce document contient des preuves techniques reproductibles (commandes + sorties) suite a l'audit contradictoire du 5 mars 2026.

## 1) Inventaire du perimetre

### 1.1 Routes API
Commande:
```bash
find src/app/api/v1 -name 'route.ts' | wc -l
```
Sortie:
```text
47
```

Commande:
```bash
find src/app/api -name 'route.ts' | wc -l
```
Sortie:
```text
48
```

### 1.2 Fichiers de tests (reconciliation explicite)
Commandes:
```bash
find tests -type f -name '*.test.ts' | wc -l
find tests/unit -type f -name '*.test.ts' | wc -l
find tests/integration -type f -name '*.test.ts' | wc -l
find tests/fixtures -type f | wc -l
```
Sorties:
```text
135
114
21
1
```

Interpretation:
- 135 suites de tests (`*.test.ts`) au total
- 114 suites unitaires
- 21 suites d'integration
- 1 fixture binaire (`tests/fixtures/copie-test.png`), exclue du comptage des suites

## 2) Verification qualite/CI

### 2.1 Audit CSRF route-level (reconciliation 48 vs 47)
Commande:
```bash
npm run ci:audit-csrf
```
Sortie:
```text
CSRF audit passed (48 route files scanned).
```

Commande (liste exacte du scanner):
```bash
node scripts/audit-csrf-routes.mjs --list-files | wc -l
node scripts/audit-csrf-routes.mjs --list-files | rg -v '^src/app/api/v1/'
```
Sortie:
```text
48
src/app/api/mcp/health/route.ts
```

Conclusion:
- Le scanner CSRF couvre `src/app/api/**` (48 routes)
- L'inventaire `api/v1` seul couvre 47 routes
- Le fichier supplementaire audite est `src/app/api/mcp/health/route.ts`

### 2.2 Typecheck
Commande:
```bash
npx tsc --noEmit
```
Sortie:
```text
(exit 0)
```

### 2.3 Coverage Gate 2 (perimetre CI unitaire)
Commande:
```bash
npx vitest run tests/unit --coverage
```
Sortie synthese:
```text
Test Files  114 passed (114)
Tests       862 passed (862)
(exit 0)
```

Commande:
```bash
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('coverage/coverage-summary.json','utf8')).total;console.log(JSON.stringify({lines:c.lines.pct,functions:c.functions.pct,branches:c.branches.pct,statements:c.statements.pct},null,2));"
```
Sortie:
```json
{
  "lines": 45.66,
  "functions": 43.55,
  "branches": 37.37,
  "statements": 45.52
}
```

Statut gate (4 metriques symetriques appliquees):
- `lines >= 45` → 45.66 → PASS
- `functions >= 43` → 43.55 → PASS
- `branches >= 37` → 37.37 → PASS
- `statements >= 45` → 45.52 → PASS

> **Note comportement DB en Gate 2** : Gate 2 CI execute uniquement `npx vitest run tests/unit --coverage` (114 fichiers).
> Les 21 tests d'integration (dont DB) sont exclus de Gate 2 et ne sont pas executes sans PostgreSQL.
> Les tests d'integration avec base de donnees reelle (pgvector) sont executes en Gate 3 (`npx vitest run tests/integration`).
> La coverage reportee en §2.3 reflete donc exclusivement le code couvert par les tests unitaires.

### 2.4 Coverage scope complet (preuve locale complete)
Commande:
```bash
npm run test:unit -- --coverage
```
Sortie synthese:
```text
Test Files  135 passed (135)
Tests       938 passed (938)
```

Coverage (scope complet):
```json
{
  "lines": 47.48,
  "functions": 46.42,
  "branches": 39.51,
  "statements": 47.45
}
```

### 2.5 Reconciliation explicite des 21 fichiers hors scope Gate 2
Commande:
```bash
comm -23 <(find tests -type f -name '*.test.ts' | sort) <(find tests/unit -type f -name '*.test.ts' | sort)
```
Sortie (21 fichiers):
```text
tests/integration/api/auth.test.ts
tests/integration/api/enseignant.test.ts
tests/integration/api/epreuves.test.ts
tests/integration/api/oral-route.test.ts
tests/integration/api/oral.test.ts
tests/integration/api/parcours.test.ts
tests/integration/api/quiz.test.ts
tests/integration/api/rag-route.test.ts
tests/integration/api/rag.test.ts
tests/integration/api/tuteur-route.test.ts
tests/integration/api/tuteur.test.ts
tests/integration/db/copie.test.ts
tests/integration/db/memory-events.test.ts
tests/integration/db/oral-session.test.ts
tests/integration/db/user-repo.test.ts
tests/integration/db/vector-search.test.ts
tests/integration/external/mistral.test.ts
tests/integration/oral-session-flow.test.ts
tests/integration/orchestrator-pipeline.test.ts
tests/integration/rag-pipeline.test.ts
tests/integration/router-agent.test.ts
```

## 3) Preuve machine des seuils Vitest (plus d'"interpretation")
Commande:
```bash
grep -A 8 "thresholds" vitest.config.ts
```
Sortie:
```text
thresholds: {
  lines: 45,
  functions: 43,
  branches: 37,
  statements: 45,
},
```

## 4) Versions stack (preuve)
Commandes:
```bash
node -p "require('./package.json').dependencies.next"
node -p "require('./package.json').dependencies.react"
node -p "require('./package.json').dependencies['@prisma/client']"
node -p "require('./package.json').dependencies.prisma"
node -p "require('./package.json').dependencies['@mistralai/mistralai']"
node -p "require('./package.json').dependencies.openai"
node -p "require('./package.json').devDependencies.vitest"
rg -n "image:\\s*redis|image:\\s*pgvector" .github/workflows/ci-cd.yml
```
Sorties:
```text
16.1.6
19.2.3
^6.16.2
^6.16.2
^1.8.1
^6.22.0
^4.0.0
61:        image: redis:7-alpine
87:        image: pgvector/pgvector:pg16
99:        image: redis:7-alpine
120:        image: pgvector/pgvector:pg16
132:        image: redis:7-alpine
174:        image: pgvector/pgvector:pg16
186:        image: redis:7-alpine
```

## 5) Signal qualite TypeScript (anti contournements)
Commande:
```bash
rg -n "@ts-ignore|@ts-expect-error|as any" src tests | wc -l
```
Sortie:
```text
3
```

Details:
```text
tests/integration/db/memory-events.test.ts:3:const state = { events: [] as any[] };
tests/integration/db/memory-events.test.ts:21:    } as any);
tests/integration/db/copie.test.ts:3:const state = { copies: [] as any[] };
```

Interpretation:
- Aucune occurrence detectee dans `src/**`
- Les 3 occurrences sont limitees a des tests d'integration

## 6) Alignement documentaire applique

Documents alignes:
- `docs/TECHNICAL_SPECIFICATIONS_COMPLETE.md`
- `docs/AUDIT_EVIDENCE_2026-03-05.md` (present document)
- `.github/workflows/ci-cd.yml`
- `scripts/audit-csrf-routes.mjs`

Points traites:
- Reconciliation 114/135 + liste exacte des 21 fichiers
- Preuve machine des seuils Vitest
- Reconciliation CSRF 48/47 avec identification du fichier hors `api/v1`
- Scope Gate 2 clarifie: tests unitaires uniquement (`npx vitest run tests/unit --coverage`)
- Scope complet conserve comme preuve locale (`npm run test:unit -- --coverage`)
- Complements versions stack critique

## 7) Preuves CI opposables (commit c0fbeb5)

Ce dossier contient des preuves locales (machine de developpement).

### 7.1 Run GitHub Actions

| Element | Valeur |
|---------|--------|
| URL | `https://github.com/cyranoaladin/Plateforme_francais/actions/runs/[RUN_ID]` |
| Commit | `c0fbeb5` |
| Gate 1 (static-analysis) | _[pass/fail — a renseigner]_ |
| Gate 2 (unit-tests + coverage) | _[pass/fail — a renseigner]_ |
| Gate 3 (integration-tests) | _[pass/fail — a renseigner]_ |
| Gate 5 (security-scan) | _[pass/fail — a renseigner]_ |

### 7.2 Artefact coverage HTML

| Element | Valeur |
|---------|--------|
| Fichier | `coverage-c0fbeb5.zip` |
| SHA-256 | _[calculer avec `sha256sum coverage-c0fbeb5.zip`]_ |

### 7.3 Complements a joindre

1. Dernier rapport OWASP ZAP (< 7 jours)
2. Preuves rotation secrets CI (MISTRAL_API_KEY, RAG_API_TOKEN)
3. Statut DPA/registre RGPD date
