# RUNBOOK Production - EAF Premium

Dernière mise à jour: 23 février 2026

## 1. Objectif
Guide d'exploitation pour:
- démarrage/arrêt
- diagnostics
- sauvegardes/restauration
- incidents
- release/rollback

## 2. Architecture opérée
- Monolithe Next.js (UI + API)
- DB principale: PostgreSQL (Prisma)
- fallback local: `.data/memory-store.json`
- fichiers copies (local): `.data/uploads/copies/*`
- worker correction: in-process

## 3. Variables critiques
- `DATABASE_URL`, `DIRECT_URL`
- `COOKIE_SECURE`, `COOKIE_SECRET`
- `LLM_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- `STORAGE_PROVIDER`, `MAX_UPLOAD_SIZE_MB`

## 4. Démarrage standard
```bash
npm install
npm run prisma:generate
npm run dev
```

Production-like:
```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

## 5. Vérifications post-démarrage
- `GET /api/v1/health`
- login/logout
- dashboard `/`
- route API critique: `/api/v1/rag/search`

## 6. Sauvegardes
## 6.1 PostgreSQL (si utilisé)
- faire des dumps réguliers (`pg_dump`)
- conserver au moins 14 jours

## 6.2 Fallback/local data
Sauvegarder:
- `.data/memory-store.json`
- `.data/uploads/`

Exemple:
```bash
mkdir -p backups
cp .data/memory-store.json backups/memory-store-$(date +%F-%H%M%S).json
cp -r .data/uploads backups/uploads-$(date +%F-%H%M%S)
```

## 7. Restauration
## 7.1 PostgreSQL
- restaurer dump
- lancer `npm run prisma:generate`

## 7.2 Fallback local
- stopper le service
- restaurer `.data/memory-store.json` + uploads
- redémarrer

## 8. Incident response
## 8.1 Symptômes fréquents
- 401 massifs: session/cookies
- 403 CSRF: token manquant/mismatch
- correction copie bloquée: worker ou provider LLM indisponible
- RAG vectoriel indisponible: fallback lexical actif

## 8.2 Plan d'action rapide
1. vérifier health
2. vérifier logs applicatifs
3. vérifier DB joignable
4. vérifier variables d'env
5. rollback si incident critique

## 9. Logs / observabilité
## 9.1 Logs backend
- logger: `pino`
- événements LLM tracés (tokens, latence, modèle, succès)

## 9.2 Métriques frontend
- Web vitals agrégés via `/api/v1/metrics/vitals`
- vue synthèse dans `/enseignant`

## 10. Release checklist
```bash
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

## 11. Rollback
1. redeployer la version N-1
2. restaurer DB/données si nécessaire
3. rerun smoke tests

## 12. Sécurité opérationnelle
- ne jamais commiter de secrets
- activer `COOKIE_SECURE=true` hors dev
- limiter l'accès shell aux opérateurs
- auditer régulièrement les dépendances

## 13. Limitations opérationnelles actuelles
- `STORAGE_PROVIDER=s3` non implémenté
- pas de queue externe pour les corrections
- agrégats vitals en mémoire non persistée
