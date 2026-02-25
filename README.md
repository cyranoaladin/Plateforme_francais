# EAF Premium

Plateforme IA premium de préparation aux Épreuves Anticipées de Français (Première voie générale) — monolithe Next.js 16.

Dernière mise à jour : 25 février 2026

## État du projet

Production : **https://eaf.nexusreussite.academy** (VPS Ubuntu 22.04, PM2, Nginx)

Fonctionnalités actives :
- Authentification par session + rôles (`eleve`, `enseignant`, `parent`, `admin`)
- Dashboard connecté aux données réelles (timeline mémoire, skill map, gamification)
- Atelier écrit : génération sujet, dépôt copie (multipart), OCR Mistral/Gemini, correction IA, rapport PDF
- Atelier oral : sessions IA 4 phases (lecture/explication/grammaire/entretien) + STT/TTS navigateur + bilan /20
- Atelier langue : exercices ciblés + feedback IA
- Onboarding diagnostique + parcours personnalisé + quiz adaptatif
- Bibliothèque enrichie (ressources structurées, filtres, RAG) + tuteur IA avec citations
- Espace enseignant (code classe, dashboard, distribution notes, export CSV, commentaires corrections)
- Gamification (badges, XP, niveaux, streaks)
- Billing/paiements : plans (FREE/PRO/MAX/MONTHLY/LIFETIME), ClicToPay, quotas par feature
- Notifications push (Web Push) + emails (Resend) + crons (rapports hebdo, rappels révision)
- Sécurité : CSP (`script-src 'self' 'unsafe-inline'`), HSTS, X-Frame-Options DENY, CSRF, rate-limiting
- Observabilité : logs structurés `pino`, métriques Web Vitals (Redis), coûts LLM (Prisma)
- MCP Server (packages/mcp-server) : protocole MCP pour intégration externe
- Tests : Vitest (60+ fichiers unitaires) + Playwright E2E

## Stack
- **Next.js 16.1.6** (App Router, Turbopack), React 19.2.3, TypeScript strict
- **Tailwind CSS 4**, Recharts, Lucide React
- **Prisma 6** + PostgreSQL 15+ (+ `pgvector` pour RAG vectoriel)
- **Redis 7+** (IoRedis) : rate-limiting, queues BullMQ, agrégation vitals
- **Mistral AI** (routeur principal : magistral-medium / mistral-small / ministral-8b / mistral-ocr)
- **Gemini / OpenAI** : adaptateurs LLM alternatifs
- Fallback JSON local conservé (`.data/memory-store.json`)
- **MCP Server** : `packages/mcp-server` (transport HTTP, port 3100)

## Démarrage rapide
```bash
npm install
cp .env.example .env.local   # si disponible, sinon créer .env
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Application : `http://localhost:3000`

Compte démo (seed) :
- Email : `jean@eaf.local`
- Mot de passe : `demo1234`

## Commandes utiles
```bash
# Développement
npm run dev                    # Next.js dev server
npm run mcp:dev                # MCP Server dev (port 3100)

# Build & production
npm run build                  # Build Next.js (Turbopack)
npm run build:ci               # Build Webpack (CI fallback)
npm run start                  # Démarrer en production

# Qualité
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test:unit              # Vitest
npm run test:e2e               # Playwright
npm run test                   # Unit + E2E
npm run test:all               # Unit + MCP tests
npm run mcp:test               # Tests MCP Server

# Base de données
npm run prisma:generate        # Générer client Prisma
npm run prisma:migrate         # Migrations dev
npm run db:seed                # Seed données démo

# Outils
npm run rag:index              # Indexation corpus RAG
npm run scheduler              # Cron scheduler
npm run mcp:init               # Init MCP Server .env + API key
npm run ci:config-sanity       # Vérification config env
```

## Variables d'environnement critiques

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | PostgreSQL direct URL (Prisma) |
| `REDIS_URL` | Redis connection string |
| `MISTRAL_API_KEY` | Clé API Mistral (LLM principal) |
| `GEMINI_API_KEY` | Clé API Google Gemini (fallback) |
| `OPENAI_API_KEY` | Clé API OpenAI (fallback) |
| `LLM_PROVIDER` | Provider par défaut (`mistral` / `gemini` / `openai`) |
| `LLM_ROUTER_ENABLED` | `"true"` pour activer routage Mistral multi-tier |
| `COOKIE_SECURE` | `"true"` en production |
| `SESSION_SECRET` | Secret session (32+ chars) |
| `CRON_SECRET` | Secret routes cron |
| `MCP_API_KEY` | Clé MCP Server (`npm run mcp:init`) |
| `CLICTOPAY_USERNAME` | Identifiant ClicToPay (paiements) |
| `CLICTOPAY_PASSWORD` | Mot de passe ClicToPay |
| `RESEND_API_KEY` | Clé API Resend (emails) |
| `VAPID_PUBLIC_KEY` | Clé VAPID push notifications |
| `VAPID_PRIVATE_KEY` | Clé VAPID privée |
| `STORAGE_PROVIDER` | `local` (défaut) ou `s3` |
| `MAX_UPLOAD_SIZE_MB` | Limite upload (20 par défaut) |

## Documentation
- Documentation complète : `docs/DOCUMENTATION_COMPLETE_PROJET.md`
- Référence API détaillée : `docs/API_REFERENCE.md`
- Cahier des charges : `docs/cahier_charges.md`
- Matrice de traçabilité : `docs/TRACEABILITY_MATRIX.md`
- Checklist audit doc : `docs/DOC_RELEASE_AUDIT_CHECKLIST.md`
- Guide élève : `docs/GUIDE_ELEVE.md`
- Guide enseignant : `docs/GUIDE_ENSEIGNANT.md`
- Runbook exploitation : `docs/RUNBOOK_PROD.md`
- Runbook déploiement : `RUNBOOK_DEPLOY.md`

## Notes importantes
- Si `pgvector`/PostgreSQL est indisponible, le RAG passe automatiquement en mode lexical.
- Si aucune clé LLM n'est fournie, les routes basées IA utilisent des sorties de fallback structurées.
- `STORAGE_PROVIDER=s3` est déclaré mais non implémenté (stockage local `.data/uploads/...` actif).
- Agrégation Web Vitals persistée en Redis (TTL 24h).
- Worker de correction de copies via BullMQ (Redis).
- Coûts LLM tracés en Prisma (`LlmCostLog`) avec alertes budget.
