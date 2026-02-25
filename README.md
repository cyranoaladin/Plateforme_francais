# EAF Premium

Plateforme de préparation aux Épreuves Anticipées de Français (Première générale) construite en monolithe Next.js 16.

## État du projet (mise à jour)
Version actuelle: application fonctionnelle en local avec:
- Authentification par session + rôles (`eleve`, `enseignant`, `parent`)
- Dashboard connecté aux données réelles (timeline mémoire)
- Atelier écrit: génération sujet, dépôt copie, OCR/correction IA, rapport PDF
- Atelier oral: sessions IA (`start/interact/end`) + STT/TTS côté navigateur
- Onboarding + parcours personnalisé + quiz adaptatif
- Bibliothèque enrichie (ressources structurées) + tuteur IA
- Espace enseignant (classe, progression, distribution notes, export CSV, commentaires)
- Gamification (badges)
- Observabilité: logs structurés `pino`, métriques Web Vitals
- Tests unitaires Vitest + E2E Playwright

## Stack
- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind CSS 4, Recharts
- Prisma + PostgreSQL (+ `pgvector` pour RAG vectoriel)
- Fallback JSON local conservé (`.data/memory-store.json`)
- Gemini/OpenAI via adaptateurs LLM

## Démarrage rapide
```bash
npm install
npm run dev
```

Application: `http://localhost:3000`

Compte démo (seed):
- `jean@eaf.local`
- `demo1234`

## Commandes utiles
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:unit
npm run test:e2e
npm run test
npx tsc --noEmit
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run rag:index
```

## Variables d'environnement
Consulter `.env.example` (fichier complet maintenu à jour), notamment:
- `DATABASE_URL`, `DIRECT_URL`
- `LLM_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- `COOKIE_SECURE`, `COOKIE_SECRET`
- `STORAGE_PROVIDER`, `MAX_UPLOAD_SIZE_MB`
- `RAG_CHUNK_SIZE`, `RAG_TOP_K`

## Documentation
- Documentation complète: `docs/DOCUMENTATION_COMPLETE_PROJET.md`
- Référence API détaillée: `docs/API_REFERENCE.md`
- Matrice de traçabilité exigences->implémentation: `docs/TRACEABILITY_MATRIX.md`
- Checklist d'audit doc release: `docs/DOC_RELEASE_AUDIT_CHECKLIST.md`
- Guide élève: `docs/GUIDE_ELEVE.md`
- Guide enseignant: `docs/GUIDE_ENSEIGNANT.md`
- Runbook exploitation: `docs/RUNBOOK_PROD.md`

## Notes importantes
- Si `pgvector`/PostgreSQL est indisponible, le RAG passe automatiquement en mode lexical.
- Si aucune clé LLM n'est fournie, les routes basées IA utilisent des sorties de fallback structurées.
- `STORAGE_PROVIDER=s3` est déclaré mais non implémenté dans cette version (local `.data/uploads/...` actif).
- Le worker de correction de copies est in-process (pas de queue externe).
