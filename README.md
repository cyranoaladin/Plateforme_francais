# Nexus EAF Platform

Dernière mise à jour: 5 mars 2026

Plateforme Next.js de préparation EAF (atelier écrit, atelier oral, tuteur IA, parcours, espace enseignant) avec orchestration LLM, RAG hybride, sécurité applicative et pipeline CI/CD multi-gates.

## État actuel vérifié

- Stack: Next.js 16.1.6, React 19, TypeScript, Prisma, PostgreSQL/pgvector, Redis.
- API: 47 routes `src/app/api/v1/**/route.ts`.
- Tests présents:
  - 169 fichiers totaux dans `tests/` (dont 1 fixture)
  - 168 fichiers classés par suites de tests.
- Exécution locale `npm run test:unit -- --coverage` (5 mars 2026):
  - `135` fichiers de tests exécutés
  - `938` tests passés
  - couverture globale: `47.48%` lignes
  - gate coverage CI (commande `npx vitest run tests/unit --coverage`): `45.66%` lignes
  - gate coverage actif en mode progressif (lignes >= 45), cible long terme `85/90/80/85`.

## Correctifs critiques déjà appliqués

- Fin des scores hardcodés en atelier oral: `src/app/atelier-oral/page.tsx` utilise la finalisation réelle `/api/v1/oral/session/:id/end`.
- Quotas LLM par skill et utilisateur: `src/lib/security/llm-rate-limiter.ts` (rpm + daily, fail-closed).
- Validation upload par magic bytes + sanitation nom de fichier: `src/lib/security/file-validator.ts`.
- CSP renforcée:
  - baseline headers: `next.config.ts`
  - nonce runtime + CSP appliquée dans `middleware.ts`.
- Timeout RAG externe: valeur par défaut 8s (`RAG_TIMEOUT_MS=8000`) dans `src/lib/rag/external-client.ts`.
- Worker correction avec retry exponentiel et statut erreur final: `src/lib/epreuves/worker.ts`.
- Sorties LLM validées par schémas + fallback: `src/lib/llm/orchestrator.ts`.

## Fonctionnalités “niveau exhaustif” implémentées

- Annotation interactive de copie:
  - mapping annotation->zones: `src/lib/correction/annotation-mapper.ts`
  - endpoint fichier copie: `src/app/api/v1/epreuves/copies/[copieId]/file/route.ts`
  - UI overlay interactive: `src/app/atelier-ecrit/correction/[copieId]/page.tsx`
- Simulation examinateur dialoguant avancée:
  - API jury avec profil examinateur + mémoire de conversation: `src/app/api/v1/oral/jury-respond/route.ts`
  - UI profil + relance contextualisée: `src/app/atelier-oral/page.tsx`

## Démarrage rapide

```bash
npm install
cp .env.example .env
npx prisma generate
# Activer pgvector (une fois par base)
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"
# Développement local
npx prisma migrate dev
# Production: npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Commandes principales

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run test:contracts
npm run test:mutation
```

## Documentation canonique

Utiliser en priorité:

- `docs/DOCUMENTATION_AUDIT_COMPLETE_INDEX.md`
- `docs/AUDIT_REPORT_COMPLETE.md`
- `docs/ARCHITECTURE_SYSTEM_DETAILED.md`
- `docs/SECURITY_COMPLIANCE_COMPLETE.md`
- `docs/TESTS_QUALITY_COMPLETE.md`
- `docs/APIS_INTEGRATIONS_COMPLETE.md`
- `docs/TECHNICAL_SPECIFICATIONS_COMPLETE.md`
- `docs/DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md`

Les anciens rapports ponctuels sont conservés en archive et ne font plus foi pour audit.
