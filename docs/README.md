# Nexus Reussite -- Preparation EAF Bac Francais 2026

Plateforme interactive de preparation aux Epreuves Anticipees de Francais (EAF) du baccalaureat 2026, destinee aux eleves de Premiere en Tunisie.

## Stack technique

- **Frontend/Backend** : Next.js 16 (App Router), TypeScript
- **ORM / Base de donnees** : Prisma 6, PostgreSQL (pgvector pour RAG local)
- **Cache** : Redis
- **CSS** : Tailwind CSS
- **LLM** : Mistral (principal), fallback Gemini/OpenAI/Ollama via routeur multi-provider
- **RAG** : Ingesteur externe Docker + fallback pgvector local
- **MCP** : Serveur MCP dedie (packages/mcp-server/, 20 outils)
- **Email** : Nodemailer SMTP (Hostinger port 587) + templates React Email

## Fonctionnalites principales

- **4 ateliers** : ecrit, oral, langue, quiz
- **Tuteur IA avec RAG** : 30 skills LLM specialisees (correction, coaching, examinateur virtuel, etc.)
- **Bibliotheque** : 548 ressources pedagogiques (PDF, video, fiches)
- **Systeme de revision** : repetition espacee, fiches, quiz adaptatif
- **Tableau de bord parent** : suivi de progression (plans payants)

## Plans tarifaires

| Plan | Prix | ID technique |
|------|------|-------------|
| Freemium | 0 TND | `FREE` |
| Premium | 99 TND/mois | `PREMIUM` |
| Masterium | 129 TND/mois | `PRO` |

Le flux de paiement au lancement est manuel : virement ou especes, l'admin genere un code d'activation, l'eleve le saisit pour activer son plan.

## Authentification

Session custom avec cookies HttpOnly et protection CSRF double-submit. Pas de JWT.

### Roles

- **eleve** : role principal, acces aux ateliers et au tuteur IA
- **parent** : optionnel, consultation du tableau de bord de progression
- **enseignant** : optionnel, gestion de classe et suivi eleves
- **admin** : gestion des codes d'activation, paiements manuels, monitoring

## Deploiement

- **Serveur** : VPS Hetzner (88.99.254.59)
- **Process manager** : PM2
- **Reverse proxy** : Nginx
- **Domaine** : eaf.nexusreussite.academy
- **Script** : `bash scripts/deploy.sh root@88.99.254.59`

## Demarrage rapide (dev local)

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Le serveur demarre sur http://localhost:3000.

## Tests

```bash
npm run test:unit    # Tests unitaires (Vitest)
npm run lint         # ESLint
npx knip             # Detection de code mort
npm run build        # Verification build complet
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) -- Structure technique du projet
- [DEPLOYMENT.md](DEPLOYMENT.md) -- Guide de deploiement en production
- [PLANS_AND_BILLING.md](PLANS_AND_BILLING.md) -- Plans, quotas et facturation
- [CONTRIBUTING.md](CONTRIBUTING.md) -- Guide du contributeur
- [EMAIL_SETUP.md](EMAIL_SETUP.md) -- Configuration email SMTP
- [GUIDE_ELEVE.md](GUIDE_ELEVE.md) -- Guide utilisateur eleve
- [GUIDE_ENSEIGNANT.md](GUIDE_ENSEIGNANT.md) -- Guide utilisateur enseignant
- [RUNBOOK_PRODUCTION.md](RUNBOOK_PRODUCTION.md) -- Operations en production
- [RUNBOOK_ORAL_VOICE_V1.md](RUNBOOK_ORAL_VOICE_V1.md) -- Configuration atelier oral/voix
