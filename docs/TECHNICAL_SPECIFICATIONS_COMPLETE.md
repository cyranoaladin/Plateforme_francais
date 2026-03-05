# Specifications Techniques - Etat Implemente

Derniere mise a jour: 5 mars 2026

## Environnement

- Node.js: 20+
- Frontend: Next.js 16.1.6, React 19.2.3
- Backend: API routes Next.js
- DB: PostgreSQL + Prisma (+ pgvector pour RAG)
- Cache/queue: Redis

## Configuration test

`vitest.config.ts`:
- include: `tests/unit/**/*.test.ts`, `tests/integration/**/*.test.ts`
- coverage include: `src/**/*.ts`, `src/**/*.tsx`
- coverage reporter: `text`, `json-summary`, `html`

### Seuils coverage (etat actuel implemente)

Seuils actifs au 5 mars 2026 (bloquants dans Vitest):
- lines: 45
- functions: 43
- branches: 37
- statements: 45

### Cible coverage (roadmap)

Seuils cibles finaux (objectif S8):
- lines: 85
- functions: 90
- branches: 80
- statements: 85

Important:
- Les valeurs 85/90/80/85 sont la cible finale, pas le seuil actuellement applique.
- Le gate coverage CI (Gate 2) est execute sur le scope unitaire:
  - `npx vitest run tests/unit --coverage`
- Les tests d'integration (dont DB) sont executes separement en Gate 3:
  - `npx vitest run tests/integration`

## Specifications securite

- Headers/CSP:
  - baseline dans `next.config.ts`
  - nonce runtime dans `middleware.ts`
- CSRF: validation server-side
- Upload:
  - types supportes: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
  - detection par magic bytes

## Specifications LLM

- Orchestrateur central avec:
  - anti-triche en entree/sortie
  - quotas par skill/user
  - parse JSON + validation schema
  - fallback structure
- Quotas par defaut:
  - `tuteur_libre`: 20 rpm / 200 daily
  - `correcteur`: 5 rpm / 50 daily
  - `coach_oral`: 10 rpm / 100 daily
  - `quiz_maitre`: 30 rpm / 300 daily
  - `coach_ecrit`: 5 rpm / 50 daily

### Resilience fournisseur (vendor lock-in)

- Provider primaire observe: Mistral (selon env/profil skill).
- Providers alternatifs supportes par le routeur: Gemini, OpenAI, mock.
- Politique de fallback:
  - erreur provider/sortie invalide: fallback de skill dans orchestrateur
  - indisponibilite prolongee fournisseur externe: bascule operationnelle via variables d'environnement vers provider alternatif.

## Specifications RAG

- Client externe avec timeout par defaut: 8000 ms
- Fallback local en cas d'echec/time-out
- Recherche hybride + rerank/fusion cote services RAG

## Specifications correction de copies

- Upload securise
- OCR puis correction baremee
- Worker asynchrone:
  - retries exponentiels x3
  - statut final `error` en cas d'echec prolonge
- Rapport PDF disponible via endpoint dedie
- Annotation interactive reliee a la copie image

## Specifications oral avance

- Session en phases (tirage, prepa, passage, bilan)
- Entretien avec relances examinateur:
  - personas `BIENVEILLANT|NEUTRE|HOSTILE`
  - memoire conversationnelle courte
