# Démarrage Rapide - Nexus EAF

Dernière mise à jour: 5 mars 2026

## Prérequis

- Node.js 20+
- PostgreSQL 16+ (pgvector recommandé)
- Redis 7+

## Installation

```bash
npm install
cp .env.example .env
npx prisma generate
# Activer pgvector (une fois par base)
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Développement local
npx prisma migrate dev

# Production (CI/CD ou serveur)
# npx prisma migrate deploy
npm run db:seed
```

## Lancement local

```bash
npm run dev
curl http://localhost:3000/api/v1/health
```

Application: `http://localhost:3000`
Compte démo: `jean@eaf.local` / `demo1234`

## Vérifications qualité

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:unit -- --coverage
npm run test:e2e
```

## Vérifications chiffrées rapides

```bash
find src/app/api/v1 -name 'route.ts' | wc -l
find tests -type f | wc -l
```

## Référence documentation audit

- `docs/DOCUMENTATION_AUDIT_COMPLETE_INDEX.md`
- `docs/TESTS_QUALITY_COMPLETE.md`
- `docs/SECURITY_COMPLIANCE_COMPLETE.md`
