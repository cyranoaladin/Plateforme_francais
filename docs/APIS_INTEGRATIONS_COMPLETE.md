# APIs & Intégrations - Référence Audit

Dernière mise à jour: 5 mars 2026

## API v1

Nombre de routes détectées: 47 (`src/app/api/v1/**/route.ts`).

Domaines principaux:
- auth
- oral
- epreuves/copies
- tuteur
- rag
- memory
- student
- enseignant
- quiz
- onboarding
- metrics/health
- payments callback

## Endpoints critiques audités

1. Oral
- `POST /api/v1/oral/session/start`
- `POST /api/v1/oral/session/:sessionId/interact`
- `POST /api/v1/oral/session/:sessionId/end`
- `POST /api/v1/oral/jury-respond`

2. Écrit/correction
- `POST /api/v1/epreuves/generate`
- `POST /api/v1/epreuves/:epreuveId/copie`
- `GET /api/v1/epreuves/:epreuveId/copie/:copieId`
- `GET /api/v1/epreuves/copies/:copieId/file`
- `GET /api/v1/epreuves/copies/:copieId/report`

3. Tuteur/RAG
- `POST /api/v1/tuteur/message`
- `POST /api/v1/rag/search`
- `GET /api/v1/rag/health`

4. Paiement (callback)
- `POST /api/v1/payments/clictopay/callback`
- `GET /api/v1/payments/clictopay/callback`
- Vérification signature HMAC si `CLICTOPAY_WEBHOOK_SECRET` configuré.
- CSRF non requis pour webhook externe, contrôle d'intégrité requis (signature).

## Intégrations externes

- LLM providers (router): Mistral, Gemini, OpenAI, mock CI
- RAG externe via `RAG_API_URL`
- Redis (quotas/queues)
- PostgreSQL/Prisma

## Contrats API

- Spécifications et exécution: `tests/contracts/**`
- Scripts Schemathesis:
  - `tests/contracts/run-schemathesis.sh`
  - `tests/contracts/run-schemathesis-auth.sh`
  - `tests/contracts/run-schemathesis-teacher-rbac.sh`

## Observabilité API

- Logging applicatif (Pino)
- Endpoint health: `/api/v1/health`
- Métriques vitals: `/api/v1/metrics/vitals`
