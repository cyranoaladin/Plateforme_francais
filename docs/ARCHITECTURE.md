# Architecture technique

## Structure du projet

```
src/
  app/                  # Next.js App Router (pages + API routes)
    (ateliers)/         # Pages des 4 ateliers (ecrit, oral, langue, quiz)
    admin/              # Interface admin (codes, paiements, monitoring)
    api/v1/             # Routes API REST (/health, /auth, /billing, /llm, etc.)
  components/           # Composants React reutilisables
  lib/                  # Logique metier
    auth/               # Session, CSRF, middleware d'authentification
    billing/            # Plan catalog, quotas, usage tracking, activation codes
    llm/                # Routeur LLM multi-provider, 30 skills specialisees
    rag/                # Client RAG, recherche semantique
    email/              # Envoi SMTP, templates
    db/                 # Client Prisma, helpers base de donnees
  data/                 # Donnees statiques (scan ressources, config oeuvres)
  scripts/              # Scripts CLI (generation codes, migration, deploy)
packages/
  mcp-server/           # Serveur MCP autonome (20 outils pour agents IA)
prisma/
  schema.prisma         # Schema de la base de donnees
  migrations/           # 19 migrations Prisma
emails/                 # Templates React Email (verification, reset, etc.)
scripts/                # Scripts d'exploitation (deploy.sh, etc.)
```

## Base de donnees

PostgreSQL avec Prisma 6 comme ORM. Le schema (`prisma/schema.prisma`) definit les tables principales :

- `User`, `Session`, `Account` -- authentification et profils
- `Plan`, `Subscription`, `ActivationCode` -- facturation
- `OralSession`, `WrittenSubmission`, `QuizAttempt` -- travail eleve
- `Resource`, `ResourceCategory` -- bibliotheque pedagogique
- `LlmUsage`, `RagQuery` -- tracking consommation IA

L'extension `pgvector` est activee pour le fallback RAG local (embeddings stockes en base).

## LLM et IA

Le routeur LLM (`src/lib/llm/router.ts`) gere le dispatch vers les providers :

- **Tier 1** : Mistral raisonnement (magistral-medium)
- **Tier 2** : Mistral standard (mistral-small)
- **Tier 3** : Ollama local (llama3.1:70b)
- **Fallback** : Gemini, OpenAI

Chaque skill dans `src/lib/llm/skills/` encapsule un prompt systeme, un modele de reponse et une logique de validation. Exemples : `correcteur.ts` (correction de copies), `coach-oral.ts` (simulation entretien), `quiz-maitre.ts` (generation de quiz).

## RAG (Retrieval-Augmented Generation)

Deux modes de fonctionnement :

1. **Ingesteur externe** : conteneur Docker qui indexe les ressources PDF et repond via API REST (`RAG_API_URL`). Mode principal en production.
2. **Fallback pgvector** : embeddings stockes dans PostgreSQL, recherche par similarite cosinus. Utilise si l'ingesteur est indisponible.

Configuration : variables `RAG_*` dans `.env`.

## Email

Envoi via SMTP Hostinger (port 587/465). Les templates sont definis avec React Email dans `emails/`. Le service d'envoi se trouve dans `src/lib/email/`.

## Facturation

Source de verite : `src/lib/billing/plan-catalog.ts`. Trois plans enumeres (FREE, PREMIUM, PRO) avec quotas et feature flags. Le suivi de consommation passe par `src/lib/billing/usage.ts`. Les codes d'activation sont haches (SHA-256 + pepper) et stockes en base.

Voir [PLANS_AND_BILLING.md](PLANS_AND_BILLING.md) pour le detail des quotas.

## MCP Server

Serveur MCP autonome dans `packages/mcp-server/`. Expose 20 outils pour les agents IA (consultation de ressources, interrogation de la base, execution de skills LLM). Communique via HTTP (`MCP_SERVER_URL`), authentifie par `MCP_API_KEY`.

## Authentification

Session server-side stockee en base. Le cookie de session est HttpOnly, SameSite=Lax, Secure en production. La protection CSRF utilise le pattern double-submit cookie. Middleware dans `src/lib/auth/`.
